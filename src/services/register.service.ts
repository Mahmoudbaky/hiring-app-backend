import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, users } from "../db/schema.js";
import { auth } from "../lib/auth.js";
import { ConflictError } from "../utils/errors.js";
import type { RegisterCompanyInput } from "../schemas/company.schema.js";
import { sendOtp } from "./otp.service.js";

async function generateUniqueCode(): Promise<string> {
  const [{ total }] = await db.select({ total: count() }).from(hiringCompanies);
  const seq = (Number(total) + 1).toString().padStart(3, "0");
  return `AG${seq}`;
}

export async function registerCompany(data: RegisterCompanyInput) {
  const { companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber } = data;

  const uniqueCode = await generateUniqueCode();

  // Check email conflict
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existingUser) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  // Create company
  const [company] = await db
    .insert(hiringCompanies)
    .values({ companyName, uniqueCode, phoneNumber, address, managerName, companyRecord })
    .returning();

  try {
    // Create user via better-auth then update role + company
    const authResult = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    const [user] = await db
      .update(users)
      .set({ role: "company_user", phoneNumber: userPhoneNumber ?? null, hiringCompanyId: company.id, updatedAt: new Date() })
      .where(eq(users.id, authResult.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        hiringCompanyId: users.hiringCompanyId,
        createdAt: users.createdAt,
      });

    // Send OTP to verify company email — non-blocking, user can resend from verify page
    sendOtp(email).catch((mailErr) => console.error("[mailer] OTP email failed:", mailErr));

    return { company, user };
  } catch (err) {
    // Roll back company if user creation fails
    await db.delete(hiringCompanies).where(eq(hiringCompanies.id, company.id));
    throw err;
  }
}
