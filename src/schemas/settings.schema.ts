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

export type CreateJobTitleInput = z.infer<typeof createJobTitleSchema>;
export type UpdateJobTitleInput = z.infer<typeof updateJobTitleSchema>;
export type CreateQualificationTypeInput = z.infer<typeof createQualificationTypeSchema>;
export type UpdateQualificationTypeInput = z.infer<typeof updateQualificationTypeSchema>;
