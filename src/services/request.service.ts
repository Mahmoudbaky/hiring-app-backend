import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  hiringCompanies,
  jobAds,
  jobRequests,
  qualificationTypeSettings,
  departments,
  professionalGrades,
  generalSpecialties,
} from "../db/schema.js";
import { BadRequestError, NotFoundError, ForbiddenError } from "../utils/index.js";
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
  nationality?: string;
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
      nationality: data.nationality,
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
  isViewedByAdmin: jobRequests.isViewedByAdmin,
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

    const { record: applicantRecord, isNew } = await upsertApplicant(data.applicant);

    if (isNew) await insertQualifications(applicantRecord.id, data.qualifications);

    const [{ total }] = await db.select({ total: count() }).from(jobRequests);
    const year = new Date().getFullYear();
    const seq = (Number(total) + 1).toString().padStart(5, "0");
    const referenceNumber = `CV-${year}-${seq}`;

    const [request] = await db
      .insert(jobRequests)
      .values({
        applicantId: applicantRecord.id,
        jobAdId: data.jobAdId,
        hiringCompanyId: company.id,
        cvUrl: data.cvUrl,
        status: "new",
        submissionType: "self",
        referenceNumber,
        departmentId: data.jobProfile?.departmentId,
        professionalGradeId: data.jobProfile?.professionalGradeId,
        generalSpecialtyId: data.jobProfile?.generalSpecialtyId,
        yearsOfExperience: data.jobProfile?.yearsOfExperience,
        additionalInfo: data.jobProfile?.additionalInfo,
      })
      .returning();

    return request;
  },

  async submitManual(
    data: CreateManualRequestInput,
    userId: string,
    companyId: string
  ) {
    const { record: applicantRecord, isNew } = await upsertApplicant(data.applicant);

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
        departmentId: data.jobProfile?.departmentId,
        professionalGradeId: data.jobProfile?.professionalGradeId,
        generalSpecialtyId: data.jobProfile?.generalSpecialtyId,
        yearsOfExperience: data.jobProfile?.yearsOfExperience,
        additionalInfo: data.jobProfile?.additionalInfo,
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
      .leftJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
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
        yearsOfExperience: jobRequests.yearsOfExperience,
        additionalInfo: jobRequests.additionalInfo,
        createdAt: jobRequests.createdAt,
        updatedAt: jobRequests.updatedAt,
        applicant: {
          id: applicants.id,
          name: applicants.name,
          email: applicants.email,
          phone: applicants.phone,
          gender: applicants.gender,
          dateOfBirth: applicants.dateOfBirth,
          nationality: applicants.nationality,
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
        department: {
          id: departments.id,
          name: departments.name,
        },
        professionalGrade: {
          id: professionalGrades.id,
          name: professionalGrades.name,
        },
        generalSpecialty: {
          id: generalSpecialties.id,
          name: generalSpecialties.name,
        },
      })
      .from(jobRequests)
      .innerJoin(applicants, eq(jobRequests.applicantId, applicants.id))
      .leftJoin(jobAds, eq(jobRequests.jobAdId, jobAds.id))
      .innerJoin(hiringCompanies, eq(jobRequests.hiringCompanyId, hiringCompanies.id))
      .leftJoin(departments, eq(jobRequests.departmentId, departments.id))
      .leftJoin(professionalGrades, eq(jobRequests.professionalGradeId, professionalGrades.id))
      .leftJoin(generalSpecialties, eq(jobRequests.generalSpecialtyId, generalSpecialties.id))
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

  async markViewedByAdmin(id: string) {
    const [updated] = await db
      .update(jobRequests)
      .set({ isViewedByAdmin: true })
      .where(eq(jobRequests.id, id))
      .returning({ id: jobRequests.id });
    return updated ?? null;
  },
};
