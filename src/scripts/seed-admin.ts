/**
 * One-time script to bootstrap the super admin user and the admin company.
 * Run once after `pnpm db:push`:
 *   pnpm tsx src/scripts/seed-admin.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, users } from "../db/schema.js";
import { auth } from "../lib/auth.js";

const ADMIN_COMPANY_NAME = "Admin Company";
const ADMIN_COMPANY_CODE = "ADMIN";

const SUPER_ADMIN_NAME  = "Super Admin";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "admin@hiringapp.com";
const SUPER_ADMIN_PASS  = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@1234";

async function main() {
  // 1. Create the admin company (idempotent)
  const [existingCompany] = await db
    .select()
    .from(hiringCompanies)
    .where(eq(hiringCompanies.uniqueCode, ADMIN_COMPANY_CODE));

  const company =
    existingCompany ??
    (
      await db
        .insert(hiringCompanies)
        .values({
          companyName: ADMIN_COMPANY_NAME,
          uniqueCode: ADMIN_COMPANY_CODE,
          isAdminCompany: true,
          isConfirmed: true,
        })
        .returning()
    )[0];

  console.log(`✔ Admin company: ${company.companyName} (code: ${company.uniqueCode})`);

  // 2. Create user via better-auth (handles password hashing + account record)
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, SUPER_ADMIN_EMAIL));

  if (existingUser) {
    console.log(`ℹ Super admin already exists: ${existingUser.email}`);
    process.exit(0);
  }

  const result = await auth.api.signUpEmail({
    body: {
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASS,
    },
  });

  // 3. Promote to super_admin and link to admin company
  await db
    .update(users)
    .set({
      role: "super_admin",
      hiringCompanyId: company.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, result.user.id));

  console.log(`✔ Super admin created`);
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Password: ${SUPER_ADMIN_PASS}`);
  console.log(`\nChange the password after first login!`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
