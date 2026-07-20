import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies, hiringUsers, clientUsers } from "../db/schema.js";
import { hiringAuth, clientAuth } from "../lib/auth.js";
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

  if (companyType === "client") {
    return registerClientCompany({ companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber });
  }

  return registerHiringCompany({ companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber });
}

async function registerHiringCompany(data: Omit<RegisterCompanyInput, "companyType">) {
  const { companyName, phoneNumber, address, managerName, companyRecord, name, email, password, userPhoneNumber } = data;

  // Check email conflict within the hiring portal
  const [existingUser] = await db
    .select({ id: hiringUsers.id })
    .from(hiringUsers)
    .where(eq(hiringUsers.email, email));
  if (existingUser) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  const uniqueCode = await generateHiringCode();

  const [company] = await db
    .insert(hiringCompanies)
    .values({ companyName, uniqueCode, phoneNumber, address, managerName, companyRecord })
    .returning();

  try {
    const authResult = await hiringAuth.api.signUpEmail({
      body: { name, email, password },
    });

    const [user] = await db
      .update(hiringUsers)
      .set({ phoneNumber: userPhoneNumber ?? null, hiringCompanyId: company.id, updatedAt: new Date() })
      .where(eq(hiringUsers.id, authResult.user.id))
      .returning({
        id: hiringUsers.id,
        name: hiringUsers.name,
        email: hiringUsers.email,
        phoneNumber: hiringUsers.phoneNumber,
        hiringCompanyId: hiringUsers.hiringCompanyId,
        createdAt: hiringUsers.createdAt,
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

  // Check email conflict within the client portal
  const [existingUser] = await db
    .select({ id: clientUsers.id })
    .from(clientUsers)
    .where(eq(clientUsers.email, email));
  if (existingUser) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  const [company] = await db
    .insert(clientCompanies)
    .values({ companyName, phoneNumber, address, managerName, companyRecord })
    .returning();

  try {
    const authResult = await clientAuth.api.signUpEmail({
      body: { name, email, password },
    });

    const [user] = await db
      .update(clientUsers)
      .set({ phoneNumber: userPhoneNumber ?? null, clientCompanyId: company.id, updatedAt: new Date() })
      .where(eq(clientUsers.id, authResult.user.id))
      .returning({
        id: clientUsers.id,
        name: clientUsers.name,
        email: clientUsers.email,
        phoneNumber: clientUsers.phoneNumber,
        clientCompanyId: clientUsers.clientCompanyId,
        createdAt: clientUsers.createdAt,
      });

    sendOtp(email).catch((err) => console.error("[mailer] OTP email failed:", err));

    return { company, user };
  } catch (err) {
    await db.delete(clientCompanies).where(eq(clientCompanies.id, company.id));
    throw err;
  }
}
