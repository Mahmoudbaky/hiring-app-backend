import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, users } from "../db/schema.js";
import { auth } from "../lib/auth.js";
import { ConflictError } from "../utils/errors.js";
import type { RegisterCompanyInput } from "../schemas/company.schema.js";
import { sendWelcomeEmail } from "../utils/mailer.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function randomCode(): string {
  return Array.from({ length: 4 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("");
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode();
    const [existing] = await db
      .select({ id: hiringCompanies.id })
      .from(hiringCompanies)
      .where(eq(hiringCompanies.uniqueCode, code));
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique company code — try again");
}

export async function registerCompany(data: RegisterCompanyInput) {
  const { companyName, phoneNumber, address, managerName, companyRecord, name, email, password } = data;

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
      .set({ role: "company_user", hiringCompanyId: company.id, updatedAt: new Date() })
      .where(eq(users.id, authResult.user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        hiringCompanyId: users.hiringCompanyId,
        createdAt: users.createdAt,
      });

    // Fire welcome email — non-blocking, failure doesn't break registration
    sendWelcomeEmail({
      to: email,
      userName: name,
      companyName,
      uniqueCode: company.uniqueCode,
    }).catch((mailErr) => console.error("[mailer] welcome email failed:", mailErr));

    return { company, user };
  } catch (err) {
    // Roll back company if user creation fails
    await db.delete(hiringCompanies).where(eq(hiringCompanies.id, company.id));
    throw err;
  }
}
