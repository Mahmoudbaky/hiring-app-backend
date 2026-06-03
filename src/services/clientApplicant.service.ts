import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  clientCompanyApplicants,
  clientCompanies,
  jobRequests,
  qualificationTypeSettings,
} from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";
import type { requestStatusEnum } from "../db/schema.js";

type ClientStatus = typeof requestStatusEnum.enumValues[number];

export const clientApplicantService = {
  async list(clientCompanyId: string) {
    const rows = await db
      .select({
        id: applicants.id,
        name: applicants.name,
        email: applicants.email,
        phone: applicants.phone,
        gender: applicants.gender,
        dateOfBirth: applicants.dateOfBirth,
        nationality: applicants.nationality,
        currentJobLocation: applicants.currentJobLocation,
        assignedClientCompanyId: applicants.assignedClientCompanyId,
        createdAt: applicants.createdAt,
        clientStatus: clientCompanyApplicants.status,
        clientTrackingId: clientCompanyApplicants.id,
      })
      .from(applicants)
      .leftJoin(
        clientCompanyApplicants,
        and(
          eq(clientCompanyApplicants.applicantId, applicants.id),
          eq(clientCompanyApplicants.clientCompanyId, clientCompanyId)
        )
      );

    return rows;
  },

  async getById(clientCompanyId: string, applicantId: string) {
    const [row] = await db
      .select({
        id: applicants.id,
        name: applicants.name,
        email: applicants.email,
        phone: applicants.phone,
        gender: applicants.gender,
        dateOfBirth: applicants.dateOfBirth,
        nationality: applicants.nationality,
        currentJobLocation: applicants.currentJobLocation,
        assignedClientCompanyId: applicants.assignedClientCompanyId,
        createdAt: applicants.createdAt,
        clientStatus: clientCompanyApplicants.status,
      })
      .from(applicants)
      .leftJoin(
        clientCompanyApplicants,
        and(
          eq(clientCompanyApplicants.applicantId, applicants.id),
          eq(clientCompanyApplicants.clientCompanyId, clientCompanyId)
        )
      )
      .where(eq(applicants.id, applicantId));

    if (!row) return null;

    const qualifications = await db
      .select({
        id: academicQualifications.id,
        qualificationTypeId: academicQualifications.qualificationTypeId,
        yearObtained: academicQualifications.yearObtained,
        instituteName: academicQualifications.instituteName,
        typeName: qualificationTypeSettings.name,
      })
      .from(academicQualifications)
      .leftJoin(
        qualificationTypeSettings,
        eq(academicQualifications.qualificationTypeId, qualificationTypeSettings.id)
      )
      .where(eq(academicQualifications.applicantId, applicantId));

    // Grab most recent CV from any job request filed by this applicant
    const [latestRequest] = await db
      .select({ cvUrl: jobRequests.cvUrl })
      .from(jobRequests)
      .where(and(eq(jobRequests.applicantId, applicantId)))
      .orderBy(desc(jobRequests.createdAt))
      .limit(1);

    const cvUrl = latestRequest?.cvUrl ?? null;

    return { ...row, qualifications, cvUrl };
  },

  async updateStatus(clientCompanyId: string, applicantId: string, status: ClientStatus) {
    const [applicant] = await db
      .select({ id: applicants.id })
      .from(applicants)
      .where(eq(applicants.id, applicantId));

    if (!applicant) throw new NotFoundError("المتقدم غير موجود");

    await db
      .insert(clientCompanyApplicants)
      .values({ clientCompanyId, applicantId, status, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [clientCompanyApplicants.clientCompanyId, clientCompanyApplicants.applicantId],
        set: { status, updatedAt: new Date() },
      });

    // Moving to review: assign this client company to the applicant
    if (status === "review") {
      await db
        .update(applicants)
        .set({ assignedClientCompanyId: clientCompanyId })
        .where(eq(applicants.id, applicantId));
    }

    // Leaving review (rejected/new): clear the assignment if it was this company
    if (status === "rejected" || status === "new") {
      await db
        .update(applicants)
        .set({ assignedClientCompanyId: null })
        .where(
          and(
            eq(applicants.id, applicantId),
            eq(applicants.assignedClientCompanyId, clientCompanyId)
          )
        );
    }

    return { applicantId, status };
  },

  async getMyCompany(clientCompanyId: string) {
    const [company] = await db
      .select()
      .from(clientCompanies)
      .where(eq(clientCompanies.id, clientCompanyId));
    return company ?? null;
  },
};
