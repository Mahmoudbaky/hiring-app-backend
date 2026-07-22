import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const updateAdminSchema = z.object({
  isFrozen: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
