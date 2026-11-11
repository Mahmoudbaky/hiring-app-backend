import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies, companyUsers } from "../db/schema.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { AppError, BadRequestError } from "../utils/errors.js";
import logger from "../lib/logger.js";

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Generic message so the endpoint never reveals whether an email is registered
// or already confirmed.
const INVALID_OTP = "رمز التحقق غير صحيح أو منتهي الصلاحية";

const OTP_SECRET = process.env.BETTER_AUTH_SECRET ?? "dev-only-otp-secret";

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// HMAC instead of a plain hash: a 6-digit code has only 1M values, so an
// unkeyed hash could be reversed instantly from a DB dump.
function hashOtp(otp: string, companyId: string): string {
  return createHmac("sha256", OTP_SECRET).update(`${companyId}:${otp}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

type PendingCompany = {
  table: typeof hiringCompanies | typeof clientCompanies;
  company: typeof hiringCompanies.$inferSelect | typeof clientCompanies.$inferSelect;
  userName: string;
};

/** The unconfirmed company owned by this email, or null. */
async function findPendingCompany(email: string): Promise<PendingCompany | null> {
  const [user] = await db
    .select({
      name: companyUsers.name,
      companyType: companyUsers.companyType,
      hiringCompanyId: companyUsers.hiringCompanyId,
      clientCompanyId: companyUsers.clientCompanyId,
    })
    .from(companyUsers)
    .where(eq(companyUsers.email, email));
  if (!user) return null;

  const table = user.companyType === "hiring" ? hiringCompanies : clientCompanies;
  const companyId = user.companyType === "hiring" ? user.hiringCompanyId : user.clientCompanyId;
  if (!companyId) return null;

  const [company] = await db.select().from(table).where(eq(table.id, companyId));
  if (!company || company.isConfirmed) return null;

  return { table, company, userName: user.name };
}

/**
 * Generate, store and email a new OTP. Silently does nothing when the email
 * has no unconfirmed company (no account enumeration).
 */
export async function sendOtp(email: string): Promise<void> {
  const pending = await findPendingCompany(email);
  if (!pending) {
    logger.info(`[otp] send skipped — no pending company for ${email}`);
    return;
  }
  const { table, company, userName } = pending;

  if (
    company.otpSentAt &&
    Date.now() - company.otpSentAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000
  ) {
    throw new AppError(429, "يرجى الانتظار دقيقة قبل طلب رمز جديد");
  }

  const otp = generateOtp();
  const now = new Date();
  await db
    .update(table)
    .set({
      otpCode: hashOtp(otp, company.id),
      otpExpiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000),
      otpAttempts: 0,
      otpSentAt: now,
      updatedAt: now,
    })
    .where(eq(table.id, company.id));

  await sendOtpEmail({ to: email, userName, otp, companyName: company.companyName });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const pending = await findPendingCompany(email);
  if (!pending) throw new BadRequestError(INVALID_OTP);
  const { table, company } = pending;

  if (!company.otpCode || !company.otpExpiresAt) {
    throw new BadRequestError("يرجى طلب رمز تحقق جديد");
  }
  if (company.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await db
      .update(table)
      .set({ otpCode: null, otpExpiresAt: null, updatedAt: new Date() })
      .where(eq(table.id, company.id));
    throw new BadRequestError("تم تجاوز عدد المحاولات المسموح، يرجى طلب رمز جديد");
  }
  if (new Date() > company.otpExpiresAt) {
    throw new BadRequestError("انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد");
  }
  if (!safeEqual(company.otpCode, hashOtp(otp, company.id))) {
    await db
      .update(table)
      .set({ otpAttempts: sql`${table.otpAttempts} + 1` })
      .where(eq(table.id, company.id));
    throw new BadRequestError(INVALID_OTP);
  }

  await db
    .update(table)
    .set({
      isConfirmed: true,
      otpCode: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      updatedAt: new Date(),
    })
    .where(eq(table.id, company.id));
}
