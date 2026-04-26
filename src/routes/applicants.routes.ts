import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { applicants, academicQualifications, jobRequests } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Applicants
 *   description: Applicant listing
 */

/**
 * @swagger
 * /api/applicants:
 *   get:
 *     summary: >
 *       List applicants.
 *       super_admin: all applicants, filterable by ?companyId=.
 *       company_user: only applicants linked to their company.
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 */
router.get("/", requireAuth, async (req, res) => {
  const user = req.user!;
  const { companyId } = req.query;

  const selectFields = {
    id: applicants.id,
    name: applicants.name,
    email: applicants.email,
    phone: applicants.phone,
    gender: applicants.gender,
    dateOfBirth: applicants.dateOfBirth,
    currentJobLocation: applicants.currentJobLocation,
    createdAt: applicants.createdAt,
  };

  // company_user only sees applicants from their own company's requests
  if (user.role === "company_user") {
    if (!user.hiringCompanyId) {
      res.json([]);
      return;
    }
    const results = await db
      .selectDistinct(selectFields)
      .from(applicants)
      .innerJoin(jobRequests, eq(applicants.id, jobRequests.applicantId))
      .where(eq(jobRequests.hiringCompanyId, user.hiringCompanyId));
    res.json(results);
    return;
  }

  // super_admin: all or filtered by company
  if (companyId) {
    const results = await db
      .selectDistinct(selectFields)
      .from(applicants)
      .innerJoin(jobRequests, eq(applicants.id, jobRequests.applicantId))
      .where(eq(jobRequests.hiringCompanyId, companyId as string));
    res.json(results);
    return;
  }

  const results = await db.select(selectFields).from(applicants);
  res.json(results);
});

/**
 * @swagger
 * /api/applicants/{id}:
 *   get:
 *     summary: Get a single applicant with their academic qualifications
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", requireAuth, async (req, res) => {
  const [applicant] = await db
    .select()
    .from(applicants)
    .where(eq(applicants.id, req.params.id as string));

  if (!applicant) {
    res.status(404).json({ error: "Applicant not found" });
    return;
  }

  // company_user can only view applicants from their company
  if (req.user!.role === "company_user") {
    const [linked] = await db
      .select({ id: jobRequests.id })
      .from(jobRequests)
      .where(
        eq(jobRequests.applicantId, applicant.id)
      );
    if (!linked) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const qualifications = await db
    .select()
    .from(academicQualifications)
    .where(eq(academicQualifications.applicantId, applicant.id));

  res.json({ ...applicant, qualifications });
});

export default router;
