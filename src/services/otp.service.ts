import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, users } from "../db/schema.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

const OTP_TTL_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getUnconfirmedCompany(email: string) {
  const [user] = await db
    .select({ hiringCompanyId: users.hiringCompanyId, name: users.name })
    .from(users)
    .where(eq(users.email, email));
  if (!user?.hiringCompanyId) throw new NotFoundError("البريد الإلكتروني غير مسجل");

  const [company] = await db
    .select()
    .from(hiringCompanies)
    .where(eq(hiringCompanies.id, user.hiringCompanyId));
  if (!company) throw new NotFoundError("الشركة غير موجودة");
  if (company.isConfirmed) throw new BadRequestError("الشركة مؤكدة بالفعل");

  return { company, userName: user.name };
}

export async function sendOtp(email: string): Promise<void> {
  const { company, userName } = await getUnconfirmedCompany(email);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await db
    .update(hiringCompanies)
    .set({ otpCode: otp, otpExpiresAt: expiresAt, updatedAt: new Date() })
    .where(eq(hiringCompanies.id, company.id));

  await sendOtpEmail({ to: email, userName, otp, companyName: company.companyName });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const { company } = await getUnconfirmedCompany(email);

  if (!company.otpCode || !company.otpExpiresAt) {
    throw new BadRequestError("يرجى طلب رمز تحقق جديد");
  }
  if (company.otpCode !== otp) {
    throw new BadRequestError("رمز التحقق غير صحيح");
  }
  if (new Date() > company.otpExpiresAt) {
    throw new BadRequestError("انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد");
  }

  await db
    .update(hiringCompanies)
    .set({ isConfirmed: true, otpCode: null, otpExpiresAt: null, updatedAt: new Date() })
    .where(eq(hiringCompanies.id, company.id));
}
