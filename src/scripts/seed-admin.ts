/**
 * One-time script to bootstrap the super admin user.
 * Run once after `pnpm db:push`:
 *   pnpm tsx src/scripts/seed-admin.ts
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminUsers } from "../db/schema.js";
import { adminAuth } from "../lib/auth.js";

const SUPER_ADMIN_NAME  = "Super Admin";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "admin@hiringapp.com";
const SUPER_ADMIN_PASS  = process.env.SUPER_ADMIN_PASSWORD ?? "Admin@1234";

async function main() {
  // Create the super admin via better-auth (handles password hashing + account record)
  const [existingUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, SUPER_ADMIN_EMAIL));

  if (existingUser) {
    console.log(`ℹ Super admin already exists: ${existingUser.email}`);
    process.exit(0);
  }

  await adminAuth.api.signUpEmail({
    body: {
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASS,
    },
  });

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
