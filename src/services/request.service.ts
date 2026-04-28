import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  hiringCompanies,
  jobAds,
  jobRequests,
  qualificationTypeSettings,
} from "../db/schema.js";
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from "../utils/index.js";
import type {
  CreateRequestInput,
  CreateManualRequestInput,
  UpdateRequestStatusInput,
} from "../schemas/request.schema.js";

// ── Internal helpers ──────────────────────────────────────────────────────────

async function upsertApplicant(data: {
  name: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
  currentJobLocation?: string;
}) {
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
  qualifications: Array<{
    qualificationTypeId?: string | null;
    yearObtained?: number;
    instituteName?: string;
  }>
) {
  if (!qualifications.length) return;
  await db
    .insert(academicQualifications)
    .values(qualifications.map((q) => ({ applicantId, ...q })));
}

const requestSelectFields = {
  id: jobRequests.id,
  status: jobRequests.status,
  submissionType: jobRequests.submissionType,
  cvUrl: jobRequests.cvUrl,
  notes: jobRequests.notes,
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
  jobAd: {
    id: jobAds.id,
    adTitle: jobAds.adTitle,
  },
  company: {
    id: hiringCompanies.id,
    companyName: hiringCompanies.companyName,
  },
};

// ── Service ───────────────────────────────────────────────────────────────────

export const requestService = {
  async submit(data: CreateRequestInput) {
    const [company] = await db
      .select()
      .from(hiringCompanies)
      .where(
        and(
          eq(hiringCompanies.uniqueCode, data.hiringCompanyCode),
          eq(hiringCompanies.isActive, true)
        )
      );
    if (!company) throw new BadRequestError("Invalid company code");

    const [job] = await db
      .select()
      .from(jobAds)
      .where(and(eq(jobAds.id, data.jobAdId), eq(jobAds.isPublished, true)));
    if (!job) throw new NotFoundError("Job not found or not open");

    const { record: applicantRecord, isNew } = await upsertApplicant(data.applicant);

    const [duplicate] = await db
      .select({ id: jobRequests.id })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.applicantId, applicantRecord.id),
          eq(jobRequests.jobAdId, data.jobAdId)
        )
      );
    if (duplicate) throw new ConflictError("Already applied for this job");

    if (isNew) await insertQualifications(applicantRecord.id, data.qualifications);

    const [request] = await db
      .insert(jobRequests)
      .values({
        applicantId: applicantRecord.id,
        jobAdId: data.jobAdId,
        hiringCompanyId: company.id,
        cvUrl: data.cvUrl,
        status: "new",
        submissionType: "self",
      })
      .returning();

    return request;
  },

  async submitManual(
    data: CreateManualRequestInput,
    userId: string,
    companyId: string
  ) {
    const [job] = await db
      .select()
      .from(jobAds)
      .where(and(eq(jobAds.id, data.jobAdId), eq(jobAds.isPublished, true)));
    if (!job) throw new NotFoundError("Job not found or not open");

    const { record: applicantRecord, isNew } = await upsertApplicant(data.applicant);

    const [duplicate] = await db
      .select({ id: jobRequests.id })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.applicantId, applicantRecord.id),
          eq(jobRequests.jobAdId, data.jobAdId)
        )
      );
    if (duplicate)
      throw new ConflictError("This applicant has already applied for this job");

    if (isNew) await insertQualifications(applicantRecord.id, data.qualifications);

    const [request] = await db
      .insert(jobRequests)
      .values({
        applicantId: applicantRecord.id,
        jobAdId: data.jobAdId,
        hiringCompanyId: companyId,
        cvUrl: data.cvUrl,
        status: "new",
        submissionType: "manual",
        submittedByUserId: userId,
      })
      .returning();

    return request;
  },

  async list(
    role: string,
    userCompanyId: string | null,
    filterCompanyId?: string
  ) {
    let whereCondition;
    if (role === "company_user") {
      if (!userCompanyId) return [];
      whereCondition = eq(jobRequests.hiringCompanyId, userCompanyId);
    } else if (filterCompanyId) {
      whereCondition = eq(jobRequests.hiringCompanyId, filterCompanyId);
    }

    return db
      .select(requestSelectFields)
      .from(jobRequests)
      .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
      .innerJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
      .innerJoin(hiringCompanies, eq(jobRequests.hiringCompanyId, hiringCompanies.id))
      .where(whereCondition)
      .orderBy(desc(jobRequests.createdAt));
  },

  async updateStatus(
    id: string,
    data: UpdateRequestStatusInput,
    role: string,
    userCompanyId: string | null
  ) {
    if (role === "company_user") {
      const [req] = await db
        .select({ hiringCompanyId: jobRequests.hiringCompanyId })
        .from(jobRequests)
        .where(eq(jobRequests.id, id));
      if (!req) throw new NotFoundError("Request not found");
      if (req.hiringCompanyId !== userCompanyId)
        throw new ForbiddenError("Access denied");
    }

    const [updated] = await db
      .update(jobRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobRequests.id, id))
      .returning();
    return updated ?? null;
  },

  async getById(id: string, role: string, userCompanyId: string | null) {
    const [request] = await db
      .select({
        id: jobRequests.id,
        status: jobRequests.status,
        submissionType: jobRequests.submissionType,
        cvUrl: jobRequests.cvUrl,
        notes: jobRequests.notes,
        createdAt: jobRequests.createdAt,
        updatedAt: jobRequests.updatedAt,
        applicant: {
          id: applicants.id,
          name: applicants.name,
          email: applicants.email,
          phone: applicants.phone,
          gender: applicants.gender,
          dateOfBirth: applicants.dateOfBirth,
          currentJobLocation: applicants.currentJobLocation,
        },
        jobAd: {
          id: jobAds.id,
          adTitle: jobAds.adTitle,
        },
        company: {
          id: hiringCompanies.id,
          companyName: hiringCompanies.companyName,
        },
      })
      .from(jobRequests)
      .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
      .innerJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
      .innerJoin(hiringCompanies, eq(jobRequests.hiringCompanyId, hiringCompanies.id))
      .where(eq(jobRequests.id, id));

    if (!request) throw new NotFoundError("Request not found");
    if (role === "company_user" && request.company.id !== userCompanyId)
      throw new ForbiddenError("Access denied");

    const qualifications = await db
      .select({
        id: academicQualifications.id,
        yearObtained: academicQualifications.yearObtained,
        instituteName: academicQualifications.instituteName,
        typeName: qualificationTypeSettings.name,
      })
      .from(academicQualifications)
      .leftJoin(
        qualificationTypeSettings,
        eq(academicQualifications.qualificationTypeId, qualificationTypeSettings.id)
      )
      .where(eq(academicQualifications.applicantId, request.applicant.id));

    return { ...request, qualifications };
  },
};
