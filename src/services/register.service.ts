import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies, clientCompanyPublicColumns, companyUsers } from "../db/schema.js";
import { insertHiringCompany } from "./company.service.js";
import { ConflictError } from "../utils/errors.js";
import type { RegisterCompanyInput } from "../schemas/company.schema.js";
import { sendOtp } from "./otp.service.js";
import { createCompanyUser } from "./user.service.js";
import logger from "../lib/logger.js";

export async function registerCompany(data: RegisterCompanyInput) {
  const {
    companyType = "hiring",
    companyName,
    phoneNumber,
    address,
    managerName,
    companyRecord,
    name,
    email,
    password,
    userPhoneNumber,
  } = data;

  // One account per email across hiring + client (company_user.email is unique).
  const [existing] = await db
    .select({ id: companyUsers.id })
    .from(companyUsers)
    .where(eq(companyUsers.email, email));
  if (existing) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  const companyValues = { companyName, phoneNumber, address, managerName, companyRecord };
  const company =
    companyType === "hiring"
      ? await insertHiringCompany(companyValues)
      : (await db.insert(clientCompanies).values(companyValues).returning(clientCompanyPublicColumns))[0];
  const companyTable = companyType === "hiring" ? hiringCompanies : clientCompanies;

  let user;
  try {
    // createCompanyUser sets the company in the same insert as the user, so
    // there is never a user row without a company.
    user = await createCompanyUser({
      name,
      email,
      password,
      phoneNumber: userPhoneNumber,
      companyType,
      companyId: company.id,
    });
  } catch (err) {
    await db.delete(companyTable).where(eq(companyTable.id, company.id));
    throw err;
  }

  // Await so the email is actually sent on serverless (Vercel stops the
  // function once the response is out). A mail failure doesn't undo the
  // registration — the user can use "resend code".
  let otpSent = true;
  try {
    await sendOtp(email);
  } catch (err) {
    otpSent = false;
    logger.error(`[mailer] OTP email failed: ${(err as Error).message}`);
  }

  return { company, user, otpSent };
}
