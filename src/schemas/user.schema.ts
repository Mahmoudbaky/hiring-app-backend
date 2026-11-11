import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().optional(),
  // super_admin must pass exactly one; company_user's own company is forced.
  hiringCompanyId: z.string().uuid().optional(),
  clientCompanyId: z.string().uuid().optional(),
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
  // Changing the password requires the current one.
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional(),
}).refine((d) => !d.newPassword || !!d.currentPassword, {
  path: ["currentPassword"],
  message: "يرجى إدخال كلمة المرور الحالية",
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
