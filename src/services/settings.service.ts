import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { jobTitleSettings, qualificationTypeSettings } from "../db/schema.js";
import type {
  CreateJobTitleInput,
  UpdateJobTitleInput,
  CreateQualificationTypeInput,
  UpdateQualificationTypeInput,
} from "../schemas/settings.schema.js";

export const settingsService = {
  // ── Job Titles ──────────────────────────────────────────────────────────────

  async listJobTitles() {
    return db
      .select()
      .from(jobTitleSettings)
      .where(eq(jobTitleSettings.isActive, true));
  },

  async createJobTitle(data: CreateJobTitleInput) {
    const [created] = await db
      .insert(jobTitleSettings)
      .values(data)
      .returning();
    return created;
  },

  async updateJobTitle(id: string, data: UpdateJobTitleInput) {
    const [updated] = await db
      .update(jobTitleSettings)
      .set(data)
      .where(eq(jobTitleSettings.id, id))
      .returning();
    return updated ?? null;
  },

  async deleteJobTitle(id: string) {
    await db
      .update(jobTitleSettings)
      .set({ isActive: false })
      .where(eq(jobTitleSettings.id, id));
  },

  // ── Qualification Types ─────────────────────────────────────────────────────

  async listQualificationTypes() {
    return db
      .select()
      .from(qualificationTypeSettings)
      .where(eq(qualificationTypeSettings.isActive, true));
  },

  async createQualificationType(data: CreateQualificationTypeInput) {
    const [created] = await db
      .insert(qualificationTypeSettings)
      .values(data)
      .returning();
    return created;
  },

  async updateQualificationType(id: string, data: UpdateQualificationTypeInput) {
    const [updated] = await db
      .update(qualificationTypeSettings)
      .set(data)
      .where(eq(qualificationTypeSettings.id, id))
      .returning();
    return updated ?? null;
  },

  async deleteQualificationType(id: string) {
    await db
      .update(qualificationTypeSettings)
      .set({ isActive: false })
      .where(eq(qualificationTypeSettings.id, id));
  },
};
