import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminUsers, companyUsers } from "../db/schema.js";
import { adminAuth, companyAuth } from "../lib/auth.js";
import type { AuthUser } from "../middleware/requireAuth.js";
import type { UpdateProfileInput } from "../schemas/user.schema.js";

type Role = AuthUser["role"];

function toProfile(role: Role, row: Record<string, any>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role,
    hiringCompanyId: role === "company_user" ? (row.hiringCompanyId ?? null) : null,
    clientCompanyId: role === "client_company_user" ? (row.clientCompanyId ?? null) : null,
    createdAt: row.createdAt,
  };
}

async function findUser(role: Role, userId: string) {
  const [user] =
    role === "super_admin"
      ? await db.select().from(adminUsers).where(eq(adminUsers.id, userId))
      : await db.select().from(companyUsers).where(eq(companyUsers.id, userId));
  return user ?? null;
}

export const profileService = {
  async get(role: Role, userId: string) {
    const user = await findUser(role, userId);
    return user ? toProfile(role, user) : null;
  },

  /**
   * `headers` are the request headers: changing the password goes through
   * better-auth so the current password is verified and other sessions end.
   */
  async update(role: Role, userId: string, data: UpdateProfileInput, headers: Headers) {
    const { newPassword, currentPassword, ...profileData } = data;

    if (newPassword && currentPassword) {
      const auth = role === "super_admin" ? adminAuth : companyAuth;
      // Throws APIError INVALID_PASSWORD (mapped to Arabic in errorHandler).
      await (auth.api.changePassword as typeof adminAuth.api.changePassword)({
        body: { currentPassword, newPassword, revokeOtherSessions: true },
        headers,
      });
    }

    if (Object.keys(profileData).length) {
      const values = { ...profileData, updatedAt: new Date() };
      if (role === "super_admin") {
        await db.update(adminUsers).set(values).where(eq(adminUsers.id, userId));
      } else {
        await db.update(companyUsers).set(values).where(eq(companyUsers.id, userId));
      }
    }

    return this.get(role, userId);
  },
};
