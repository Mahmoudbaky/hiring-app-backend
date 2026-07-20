import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringUsers } from "../db/schema.js";
import { hiringAuth } from "../lib/auth.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

const userFields = {
  id: hiringUsers.id,
  name: hiringUsers.name,
  email: hiringUsers.email,
  phoneNumber: hiringUsers.phoneNumber,
  isFrozen: hiringUsers.isFrozen,
  hiringCompanyId: hiringUsers.hiringCompanyId,
  createdAt: hiringUsers.createdAt,
} as const;

export const userService = {
  async list(hiringCompanyId?: string | null) {
    return db
      .select(userFields)
      .from(hiringUsers)
      .where(hiringCompanyId ? eq(hiringUsers.hiringCompanyId, hiringCompanyId) : undefined)
      .orderBy(hiringUsers.createdAt);
  },

  async create(data: CreateUserInput) {
    const result = await hiringAuth.api.signUpEmail({
      body: { name: data.name, email: data.email, password: data.password },
    });

    const [created] = await db
      .update(hiringUsers)
      .set({
        phoneNumber: data.phoneNumber ?? null,
        hiringCompanyId: data.hiringCompanyId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(hiringUsers.id, result.user.id))
      .returning(userFields);

    return created;
  },

  async update(id: string, data: UpdateUserInput) {
    const [updated] = await db
      .update(hiringUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hiringUsers.id, id))
      .returning(userFields);
    return updated ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db.delete(hiringUsers).where(eq(hiringUsers.id, id)).returning({ id: hiringUsers.id });
    return deleted ?? null;
  },
};
