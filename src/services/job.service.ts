import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { jobAds } from "../db/schema.js";
import type { CreateJobInput, UpdateJobInput } from "../schemas/job.schema.js";

export const jobService = {
  async list(role: string) {
    if (role === "super_admin") {
      return db.select().from(jobAds).orderBy(desc(jobAds.createdAt));
    }
    return db
      .select()
      .from(jobAds)
      .where(eq(jobAds.isPublished, true))
      .orderBy(desc(jobAds.createdAt));
  },

  async getById(id: string, role: string) {
    const [job] = await db.select().from(jobAds).where(eq(jobAds.id, id));
    if (!job) return null;
    if (role !== "super_admin" && !job.isPublished) return null;
    return job;
  },

  async create(data: CreateJobInput, userId: string) {
    const { deadline, ...rest } = data;
    const [job] = await db
      .insert(jobAds)
      .values({
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        createdBy: userId,
      })
      .returning();
    return job;
  },

  async update(id: string, data: UpdateJobInput) {
    const { deadline, ...rest } = data;
    const [job] = await db
      .update(jobAds)
      .set({
        ...rest,
        ...(deadline !== undefined
          ? { deadline: deadline ? new Date(deadline) : null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(jobAds.id, id))
      .returning();
    return job ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(jobAds)
      .where(eq(jobAds.id, id))
      .returning({ id: jobAds.id });
    return deleted ?? null;
  },
};
