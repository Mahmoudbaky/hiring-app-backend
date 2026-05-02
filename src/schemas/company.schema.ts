import { z } from "zod";

export const createCompanySchema = z.object({
  companyName: z.string().min(1),
  uniqueCode: z.string().min(1).max(50),
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
  isActive: z.boolean().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const registerCompanySchema = z.object({
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
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
