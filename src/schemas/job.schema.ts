import { z } from "zod";

export const createJobSchema = z.object({
  adTitle: z.string().min(1),
  jobTitleId: z.string().uuid().nullish(),
  adType: z.enum(["remote", "on_site", "hybrid"]),
  salaryFrom: z.number().int().positive().optional(),
  salaryTo: z.number().int().positive().optional(),
  description: z.string().optional(),
  isPublished: z.boolean().default(false),
  deadline: z.string().nullish(),
});

export const updateJobSchema = z.object({
  adTitle: z.string().min(1).optional(),
  jobTitleId: z.string().uuid().nullish(),
  adType: z.enum(["remote", "on_site", "hybrid"]).optional(),
  salaryFrom: z.number().int().positive().nullish(),
  salaryTo: z.number().int().positive().nullish(),
  description: z.string().nullish(),
  isPublished: z.boolean().optional(),
  deadline: z.string().nullish(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
