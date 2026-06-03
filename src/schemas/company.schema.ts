import { z } from "zod";

export const createCompanySchema = z.object({
  companyName: z.string().min(1),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  managerName: z.string().optional(),
  companyRecord: z.string().optional(),
});

export const updateCompanySchema = z.object({
  companyName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  managerName: z.string().optional(),
  companyRecord: z.string().optional(),
  logo: z.string().url().nullish(),
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const registerCompanySchema = z.object({
  // Company type
  companyType: z.enum(["hiring", "client"]).default("hiring"),
  // Company info
  companyName: z.string().min(1),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  managerName: z.string().optional(),
  companyRecord: z.string().optional(),
  // First user info
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  userPhoneNumber: z.string().optional(),
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
