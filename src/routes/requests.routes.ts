import { Router, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  jobRequests,
  jobAds,
  hiringCompanies,
} from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Job application / hiring request management
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

type ApplicantInput = {
  name: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  currentJobLocation?: string;
};

type QualificationInput = {
  qualificationTypeId: string;
  yearObtained?: number;
  instituteName?: string;
};

async function upsertApplicant(data: ApplicantInput) {
  const [existing] = await db
    .select()
    .from(applicants)
    .where(eq(applicants.email, data.email));

  if (existing) return { record: existing, isNew: false };

  const [created] = await db
    .insert(applicants)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      gender: data.gender as "male" | "female" | undefined,
      dateOfBirth: data.dateOfBirth,
      currentJobLocation: data.currentJobLocation,
    })
    .returning();

  return { record: created, isNew: true };
}

async function insertQualifications(
  applicantId: string,
  qualifications: QualificationInput[]
) {
  if (!qualifications?.length) return;
  await db.insert(academicQualifications).values(
    qualifications.map((q) => ({ applicantId, ...q }))
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: >
 *       Public — applicant submits their own application using a company's unique code.
 *       No authentication required.
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobAdId, hiringCompanyCode, applicant]
 *             properties:
 *               jobAdId: { type: string }
 *               hiringCompanyCode: { type: string }
 *               cvUrl: { type: string }
 *               applicant:
 *                 type: object
 *                 required: [name, email, phone]
 *               qualifications:
 *                 type: array
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const {
    jobAdId,
    hiringCompanyCode,
    applicant: applicantData,
    qualifications,
    cvUrl,
  } = req.body;

  const [company] = await db
    .select()
    .from(hiringCompanies)
    .where(
      and(
        eq(hiringCompanies.uniqueCode, hiringCompanyCode),
        eq(hiringCompanies.isActive, true)
      )
    );

  if (!company) {
    res.status(400).json({ error: "Invalid company code" });
    return;
  }

  const [job] = await db
    .select()
    .from(jobAds)
    .where(and(eq(jobAds.id, jobAdId), eq(jobAds.isPublished, true)));

  if (!job) {
    res.status(404).json({ error: "Job not found or not open" });
    return;
  }

  const { record: applicantRecord, isNew } =
    await upsertApplicant(applicantData);

  const [duplicate] = await db
    .select({ id: jobRequests.id })
    .from(jobRequests)
    .where(
      and(
        eq(jobRequests.applicantId, applicantRecord.id),
        eq(jobRequests.jobAdId, jobAdId)
      )
    );

  if (duplicate) {
    res.status(409).json({ error: "You have already applied for this job" });
    return;
  }

  if (isNew) await insertQualifications(applicantRecord.id, qualifications ?? []);

  const [request] = await db
    .insert(jobRequests)
    .values({
      applicantId: applicantRecord.id,
      jobAdId,
      hiringCompanyId: company.id,
      cvUrl,
      status: "new",
      submissionType: "self",
    })
    .returning();

  res.status(201).json(request);
});

/**
 * @swagger
 * /api/requests/manual:
 *   post:
 *     summary: Company user manually submits an application on behalf of an applicant
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/manual",
  requireAuth,
  requireRole("company_user"),
  async (req: Request, res: Response): Promise<void> => {
    const { jobAdId, applicant: applicantData, qualifications, cvUrl } =
      req.body;
    const user = req.user!;

    if (!user.hiringCompanyId) {
      res.status(403).json({ error: "User is not associated with a company" });
      return;
    }

    const [job] = await db
      .select()
      .from(jobAds)
      .where(and(eq(jobAds.id, jobAdId), eq(jobAds.isPublished, true)));

    if (!job) {
      res.status(404).json({ error: "Job not found or not open" });
      return;
    }

    const { record: applicantRecord, isNew } =
      await upsertApplicant(applicantData);

    const [duplicate] = await db
      .select({ id: jobRequests.id })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.applicantId, applicantRecord.id),
          eq(jobRequests.jobAdId, jobAdId)
        )
      );

    if (duplicate) {
      res
        .status(409)
        .json({ error: "This applicant has already applied for this job" });
      return;
    }

    if (isNew) await insertQualifications(applicantRecord.id, qualifications ?? []);

    const [request] = await db
      .insert(jobRequests)
      .values({
        applicantId: applicantRecord.id,
        jobAdId,
        hiringCompanyId: user.hiringCompanyId,
        cvUrl,
        status: "new",
        submissionType: "manual",
        submittedByUserId: user.id,
      })
      .returning();

    res.status(201).json(request);
  }
);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: >
 *       List job requests.
 *       super_admin: all, filterable by ?companyId=.
 *       company_user: only their company's requests.
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 */
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { companyId } = req.query;

  const selectFields = {
    id: jobRequests.id,
    status: jobRequests.status,
    submissionType: jobRequests.submissionType,
    cvUrl: jobRequests.cvUrl,
    notes: jobRequests.notes,
    jobAdId: jobRequests.jobAdId,
    hiringCompanyId: jobRequests.hiringCompanyId,
    createdAt: jobRequests.createdAt,
    updatedAt: jobRequests.updatedAt,
    applicant: {
      id: applicants.id,
      name: applicants.name,
      email: applicants.email,
      phone: applicants.phone,
      gender: applicants.gender,
      currentJobLocation: applicants.currentJobLocation,
    },
  };

  let whereCondition;

  if (user.role === "company_user") {
    if (!user.hiringCompanyId) {
      res.json([]);
      return;
    }
    whereCondition = eq(jobRequests.hiringCompanyId, user.hiringCompanyId);
  } else if (companyId) {
    whereCondition = eq(jobRequests.hiringCompanyId, companyId as string);
  }

  const results = await db
    .select(selectFields)
    .from(jobRequests)
    .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
    .where(whereCondition)
    .orderBy(desc(jobRequests.createdAt));

  res.json(results);
});

/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Update the status of a job request (super admin only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, review, shortlisted, interview, rejected, hired]
 *               notes:
 *                 type: string
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("super_admin"),
  async (req: Request, res: Response): Promise<void> => {
    const { status, notes } = req.body;

    const [updated] = await db
      .update(jobRequests)
      .set({ status, notes, updatedAt: new Date() })
      .where(eq(jobRequests.id, req.params.id as string))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
