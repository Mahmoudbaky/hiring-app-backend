import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { auth } from "../lib/auth.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

const userFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  hiringCompanyId: users.hiringCompanyId,
  createdAt: users.createdAt,
} as const;

export const userService = {
  async list(hiringCompanyId?: string | null) {
    return db
      .select(userFields)
      .from(users)
      .where(hiringCompanyId ? eq(users.hiringCompanyId, hiringCompanyId) : undefined)
      .orderBy(users.createdAt);
  },

  async create(data: CreateUserInput) {
    const result = await auth.api.signUpEmail({
      body: { name: data.name, email: data.email, password: data.password },
    });

    const [created] = await db
      .update(users)
      .set({
        role: "company_user",
        hiringCompanyId: data.hiringCompanyId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.user.id))
      .returning(userFields);

    return created;
  },

  async update(id: string, data: UpdateUserInput) {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(userFields);
    return updated ?? null;
  },
};
