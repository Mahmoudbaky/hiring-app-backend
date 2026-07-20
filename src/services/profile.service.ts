import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  adminUsers,
  adminAccounts,
  hiringUsers,
  hiringAccounts,
  clientUsers,
  clientAccounts,
} from "../db/schema.js";
import { adminAuth, hiringAuth, clientAuth } from "../lib/auth.js";
import type { AuthUser } from "../middleware/requireAuth.js";
import type { UpdateProfileInput } from "../schemas/user.schema.js";

type Role = AuthUser["role"];

// Resolve the portal-specific tables + auth instance for a given role.
function portalFor(role: Role) {
  switch (role) {
    case "super_admin":
      return { userTable: adminUsers, accountTable: adminAccounts, auth: adminAuth };
    case "client_company_user":
      return { userTable: clientUsers, accountTable: clientAccounts, auth: clientAuth };
    case "company_user":
    default:
      return { userTable: hiringUsers, accountTable: hiringAccounts, auth: hiringAuth };
  }
}

function toProfile(role: Role, row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role,
    hiringCompanyId: role === "company_user" ? row.hiringCompanyId ?? null : null,
    clientCompanyId: role === "client_company_user" ? row.clientCompanyId ?? null : null,
    createdAt: row.createdAt,
  };
}

export const profileService = {
  async get(role: Role, userId: string) {
    const { userTable } = portalFor(role);
    const [user] = await db.select().from(userTable as any).where(eq((userTable as any).id, userId));
    return user ? toProfile(role, user) : null;
  },

  async update(role: Role, userId: string, data: UpdateProfileInput) {
    const { userTable, accountTable, auth } = portalFor(role);
    const { newPassword, ...profileData } = data;

    if (newPassword) {
      const ctx = await auth.$context;
      const hashed = await ctx.password.hash(newPassword);
      await db
        .update(accountTable as any)
        .set({ password: hashed, updatedAt: new Date() })
        .where(and(eq((accountTable as any).userId, userId), eq((accountTable as any).providerId, "credential")));
    }

    const [updated] = await db
      .update(userTable as any)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq((userTable as any).id, userId))
      .returning();
    return updated ? toProfile(role, updated) : null;
  },
};
