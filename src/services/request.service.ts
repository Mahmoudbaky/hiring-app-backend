import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  hiringCompanies,
  jobAds,
  jobRequests,
} from "../db/schema.js";
import { AppError } from "../lib/errors.js";
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
    if (!company) throw new AppError(400, "Invalid company code");

    const [job] = await db
      .select()
      .from(jobAds)
      .where(and(eq(jobAds.id, data.jobAdId), eq(jobAds.isPublished, true)));
    if (!job) throw new AppError(404, "Job not found or not open");

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
    if (duplicate) throw new AppError(409, "Already applied for this job");

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
    if (!job) throw new AppError(404, "Job not found or not open");

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
      throw new AppError(409, "This applicant has already applied for this job");

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
      .where(whereCondition)
      .orderBy(desc(jobRequests.createdAt));
  },

  async updateStatus(id: string, data: UpdateRequestStatusInput) {
    const [updated] = await db
      .update(jobRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobRequests.id, id))
      .returning();
    return updated ?? null;
  },
};
