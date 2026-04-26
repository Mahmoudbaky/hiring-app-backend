import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  applicants,
  academicQualifications,
  jobRequests,
} from "../db/schema.js";

const applicantFields = {
  id: applicants.id,
  name: applicants.name,
  email: applicants.email,
  phone: applicants.phone,
  gender: applicants.gender,
  dateOfBirth: applicants.dateOfBirth,
  currentJobLocation: applicants.currentJobLocation,
  createdAt: applicants.createdAt,
};

export const applicantService = {
  async list(
    role: string,
    userCompanyId: string | null,
    filterCompanyId?: string,
  ) {
    if (role === "company_user") {
      if (!userCompanyId) return [];
      return db
        .selectDistinct(applicantFields)
        .from(applicants)
        .innerJoin(jobRequests, eq(applicants.id, jobRequests.applicantId))
        .where(eq(jobRequests.hiringCompanyId, userCompanyId));
    }

    if (filterCompanyId) {
      return db
        .selectDistinct(applicantFields)
        .from(applicants)
        .innerJoin(jobRequests, eq(applicants.id, jobRequests.applicantId))
        .where(eq(jobRequests.hiringCompanyId, filterCompanyId));
    }

    return db.select(applicantFields).from(applicants);
  },

  async getById(id: string, role: string, userCompanyId: string | null) {
    const [applicant] = await db
      .select()
      .from(applicants)
      .where(eq(applicants.id, id));

    if (!applicant) return null;

    if (role === "company_user") {
      const [linked] = await db
        .select({ id: jobRequests.id })
        .from(jobRequests)
        .where(eq(jobRequests.applicantId, applicant.id));
      if (!linked) return "forbidden" as const;
    }

    const qualifications = await db
      .select()
      .from(academicQualifications)
      .where(eq(academicQualifications.applicantId, applicant.id));

    return { ...applicant, qualifications };
  },
};
