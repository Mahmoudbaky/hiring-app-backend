import { z } from "zod";

export const createJobTitleSchema = z.object({
  title: z.string().min(1),
});

export const updateJobTitleSchema = z.object({
  title: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const createQualificationTypeSchema = z.object({
  name: z.string().min(1),
});

export const updateQualificationTypeSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ── Departments ───────────────────────────────────────────────────────────────

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  hasExtraSpecialties: z.boolean().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  hasExtraSpecialties: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ── Professional Grades ───────────────────────────────────────────────────────

export const createProfessionalGradeSchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid(),
});

export const updateProfessionalGradeSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ── General Specialties ───────────────────────────────────────────────────────

export const createGeneralSpecialtySchema = z.object({
  name: z.string().min(1),
  departmentId: z.string().uuid(),
});

export const updateGeneralSpecialtySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateJobTitleInput = z.infer<typeof createJobTitleSchema>;
export type UpdateJobTitleInput = z.infer<typeof updateJobTitleSchema>;
export type CreateQualificationTypeInput = z.infer<typeof createQualificationTypeSchema>;
export type UpdateQualificationTypeInput = z.infer<typeof updateQualificationTypeSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateProfessionalGradeInput = z.infer<typeof createProfessionalGradeSchema>;
export type UpdateProfessionalGradeInput = z.infer<typeof updateProfessionalGradeSchema>;
export type CreateGeneralSpecialtyInput = z.infer<typeof createGeneralSpecialtySchema>;
export type UpdateGeneralSpecialtyInput = z.infer<typeof updateGeneralSpecialtySchema>;
