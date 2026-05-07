import { z } from "zod";

export const applicantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  currentJobLocation: z.string().optional(),
});

export const qualificationSchema = z.object({
  qualificationTypeId: z.string().uuid().nullish(),
  yearObtained: z.number().int().optional(),
  instituteName: z.string().optional(),
});

const jobProfileSchema = z.object({
  departmentId: z.string().uuid().optional(),
  professionalGradeId: z.string().uuid().optional(),
  generalSpecialtyId: z.string().uuid().optional(),
  yearsOfExperience: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export const createRequestSchema = z.object({
  jobAdId: z.string().uuid().optional(),
  hiringCompanyCode: z.string().min(1),
  cvUrl: z.string().optional(),
  applicant: applicantSchema,
  qualifications: z.array(qualificationSchema).default([]),
  jobProfile: jobProfileSchema.optional(),
});

export const createManualRequestSchema = z.object({
  jobAdId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  cvUrl: z.string().optional(),
  applicant: applicantSchema,
  qualifications: z.array(qualificationSchema).default([]),
  jobProfile: jobProfileSchema.optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["new", "review", "shortlisted", "interview", "rejected", "hired"]),
  notes: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type CreateManualRequestInput = z.infer<typeof createManualRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
