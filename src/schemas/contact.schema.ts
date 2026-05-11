import { z } from "zod";

export const createContactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
