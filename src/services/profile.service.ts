import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, accounts } from "../db/schema.js";
import { auth } from "../lib/auth.js";
import type { UpdateProfileInput } from "../schemas/user.schema.js";

const profileFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  image: users.image,
  role: users.role,
  hiringCompanyId: users.hiringCompanyId,
  createdAt: users.createdAt,
} as const;

export const profileService = {
  async get(userId: string) {
    const [user] = await db.select(profileFields).from(users).where(eq(users.id, userId));
    return user ?? null;
  },

  async update(userId: string, data: UpdateProfileInput) {
    const { newPassword, ...profileData } = data;

    if (newPassword) {
      const ctx = await auth.$context;
      const hashed = await ctx.password.hash(newPassword);
      await db
        .update(accounts)
        .set({ password: hashed, updatedAt: new Date() })
        .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")));
    }

    const [updated] = await db
      .update(users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(profileFields);
    return updated ?? null;
  },
};
