import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies, users } from "../db/schema.js";
import { auth } from "../lib/auth.js";
import { ConflictError } from "../utils/errors.js";
import type { RegisterCompanyInput } from "../schemas/company.schema.js";
import { sendOtp } from "./otp.service.js";

async function generateHiringCode(): Promise<string> {
  const [{ total }] = await db.select({ total: count() }).from(hiringCompanies);
  const seq = (Number(total) + 1).toString().padStart(3, "0");
  return `AG${seq}`;
}

export async function registerCompany(data: RegisterCompanyInput) {
  const { companyType = "hiring", companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber } = data;

  // Check email conflict
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existingUser) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  if (companyType === "client") {
    return registerClientCompany({ companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber });
  }

  return registerHiringCompany({ companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber });
}

async function registerHiringCompany(data: Omit<RegisterCompanyInput, "companyType">) {
  const { companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber } = data;

  const uniqueCode = await generateHiringCode();

  const [company] = await db
    .insert(hiringCompanies)
    .values({ companyName, uniqueCode, phoneNumber, address, managerName, companyRecord })
    .returning();

  try {
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

    sendOtp(email).catch((err) => console.error("[mailer] OTP email failed:", err));

    return { company, user };
  } catch (err) {
    await db.delete(hiringCompanies).where(eq(hiringCompanies.id, company.id));
    throw err;
  }
}

async function registerClientCompany(data: Omit<RegisterCompanyInput, "companyType">) {
  const { companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber } = data;

  const [company] = await db
    .insert(clientCompanies)
    .values({ companyName, phoneNumber, address, managerName, companyRecord })
    .returning();

  try {
    const authResult = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    const [user] = await db
      .update(users)
      .set({ role: "client_company_user", phoneNumber: userPhoneNumber ?? null, clientCompanyId: company.id, updatedAt: new Date() })
      .where(eq(users.id, authResult.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        clientCompanyId: users.clientCompanyId,
        createdAt: users.createdAt,
      });

    sendOtp(email).catch((err) => console.error("[mailer] OTP email failed:", err));

    return { company, user };
  } catch (err) {
    await db.delete(clientCompanies).where(eq(clientCompanies.id, company.id));
    throw err;
  }
}
