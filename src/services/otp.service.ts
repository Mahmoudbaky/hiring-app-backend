import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies, users } from "../db/schema.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

const OTP_TTL_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type UnconfirmedResult = {
  companyId: string;
  companyName: string;
  type: "hiring" | "client";
  userName: string;
};

async function getUnconfirmedCompany(email: string): Promise<UnconfirmedResult> {
  const [user] = await db
    .select({ hiringCompanyId: users.hiringCompanyId, clientCompanyId: users.clientCompanyId, name: users.name })
    .from(users)
    .where(eq(users.email, email));

  if (!user) throw new NotFoundError("البريد الإلكتروني غير مسجل");

  if (user.hiringCompanyId) {
    const [company] = await db
      .select()
      .from(hiringCompanies)
      .where(eq(hiringCompanies.id, user.hiringCompanyId));
    if (!company) throw new NotFoundError("الشركة غير موجودة");
    if (company.isConfirmed) throw new BadRequestError("الشركة مؤكدة بالفعل");
    return { companyId: company.id, companyName: company.companyName, type: "hiring", userName: user.name };
  }

  if (user.clientCompanyId) {
    const [company] = await db
      .select()
      .from(clientCompanies)
      .where(eq(clientCompanies.id, user.clientCompanyId));
    if (!company) throw new NotFoundError("الشركة غير موجودة");
    if (company.isConfirmed) throw new BadRequestError("الشركة مؤكدة بالفعل");
    return { companyId: company.id, companyName: company.companyName, type: "client", userName: user.name };
  }

  throw new NotFoundError("البريد الإلكتروني غير مسجل");
}

export async function sendOtp(email: string): Promise<void> {
  const { companyId, companyName, type, userName } = await getUnconfirmedCompany(email);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  if (type === "hiring") {
    await db
      .update(hiringCompanies)
      .set({ otpCode: otp, otpExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(hiringCompanies.id, companyId));
  } else {
    await db
      .update(clientCompanies)
      .set({ otpCode: otp, otpExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(clientCompanies.id, companyId));
  }

  await sendOtpEmail({ to: email, userName, otp, companyName });
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const { companyId, type } = await getUnconfirmedCompany(email);

  const [company] =
    type === "hiring"
      ? await db.select().from(hiringCompanies).where(eq(hiringCompanies.id, companyId))
      : await db.select().from(clientCompanies).where(eq(clientCompanies.id, companyId));

  if (!company.otpCode || !company.otpExpiresAt) {
    throw new BadRequestError("يرجى طلب رمز تحقق جديد");
  }
  if (company.otpCode !== otp) {
    throw new BadRequestError("رمز التحقق غير صحيح");
  }
  if (new Date() > company.otpExpiresAt) {
    throw new BadRequestError("انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد");
  }

  if (type === "hiring") {
    await db
      .update(hiringCompanies)
      .set({ isConfirmed: true, otpCode: null, otpExpiresAt: null, updatedAt: new Date() })
      .where(eq(hiringCompanies.id, companyId));
  } else {
    await db
      .update(clientCompanies)
      .set({ isConfirmed: true, otpCode: null, otpExpiresAt: null, updatedAt: new Date() })
      .where(eq(clientCompanies.id, companyId));
  }
}
