import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: z.string().optional(),
  hiringCompanyId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().nullish(),
  isFrozen: z.boolean().optional(),
  hiringCompanyId: z.string().uuid().nullish(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().nullish(),
  newPassword: z.string().min(8).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
