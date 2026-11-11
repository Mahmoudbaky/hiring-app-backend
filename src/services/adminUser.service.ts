import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminUsers } from "../db/schema.js";
import { adminAuth, createCredentialUser } from "../lib/auth.js";
import { ConflictError } from "../utils/errors.js";
import type { CreateAdminInput, UpdateAdminInput } from "../schemas/adminUser.schema.js";

const adminFields = {
  id: adminUsers.id,
  name: adminUsers.name,
  email: adminUsers.email,
  isFrozen: adminUsers.isFrozen,
  createdAt: adminUsers.createdAt,
} as const;

export const adminUserService = {
  async list() {
    return db.select(adminFields).from(adminUsers).orderBy(adminUsers.createdAt);
  },

  async create(data: CreateAdminInput) {
    const [existing] = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.email, data.email));
    if (existing) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

    const user = await createCredentialUser(adminAuth, data);

    const [created] = await db
      .select(adminFields)
      .from(adminUsers)
      .where(eq(adminUsers.id, user.id));

    return created;
  },

  async update(id: string, data: UpdateAdminInput) {
    const [updated] = await db
      .update(adminUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning(adminFields);
    // Freezing must take effect now: end the admin's sessions.
    if (updated && data.isFrozen) {
      const ctx = await adminAuth.$context;
      await ctx.internalAdapter.deleteUserSessions(id);
    }
    return updated ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id });
    return deleted ?? null;
  },
};
