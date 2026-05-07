import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  jobTitleSettings,
  qualificationTypeSettings,
  departments,
  professionalGrades,
  generalSpecialties,
} from "../db/schema.js";
import type {
  CreateJobTitleInput,
  UpdateJobTitleInput,
  CreateQualificationTypeInput,
  UpdateQualificationTypeInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateProfessionalGradeInput,
  UpdateProfessionalGradeInput,
  CreateGeneralSpecialtyInput,
  UpdateGeneralSpecialtyInput,
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

  // ── Departments ─────────────────────────────────────────────────────────────

  async listDepartments() {
    return db.select().from(departments).where(eq(departments.isActive, true));
  },

  async createDepartment(data: CreateDepartmentInput) {
    const [created] = await db.insert(departments).values(data).returning();
    return created;
  },

  async updateDepartment(id: string, data: UpdateDepartmentInput) {
    const [updated] = await db
      .update(departments)
      .set(data)
      .where(eq(departments.id, id))
      .returning();
    return updated ?? null;
  },

  async deleteDepartment(id: string) {
    await db.update(departments).set({ isActive: false }).where(eq(departments.id, id));
  },

  // ── Professional Grades ─────────────────────────────────────────────────────

  async listProfessionalGrades(departmentId?: string) {
    const condition = departmentId
      ? and(eq(professionalGrades.isActive, true), eq(professionalGrades.departmentId, departmentId))
      : eq(professionalGrades.isActive, true);
    return db.select().from(professionalGrades).where(condition);
  },

  async createProfessionalGrade(data: CreateProfessionalGradeInput) {
    const [created] = await db.insert(professionalGrades).values(data).returning();
    return created;
  },

  async updateProfessionalGrade(id: string, data: UpdateProfessionalGradeInput) {
    const [updated] = await db
      .update(professionalGrades)
      .set(data)
      .where(eq(professionalGrades.id, id))
      .returning();
    return updated ?? null;
  },

  async deleteProfessionalGrade(id: string) {
    await db.update(professionalGrades).set({ isActive: false }).where(eq(professionalGrades.id, id));
  },

  // ── General Specialties ─────────────────────────────────────────────────────

  async listGeneralSpecialties(departmentId?: string) {
    const condition = departmentId
      ? and(eq(generalSpecialties.isActive, true), eq(generalSpecialties.departmentId, departmentId))
      : eq(generalSpecialties.isActive, true);
    return db.select().from(generalSpecialties).where(condition);
  },

  async createGeneralSpecialty(data: CreateGeneralSpecialtyInput) {
    const [created] = await db.insert(generalSpecialties).values(data).returning();
    return created;
  },

  async updateGeneralSpecialty(id: string, data: UpdateGeneralSpecialtyInput) {
    const [updated] = await db
      .update(generalSpecialties)
      .set(data)
      .where(eq(generalSpecialties.id, id))
      .returning();
    return updated ?? null;
  },

  async deleteGeneralSpecialty(id: string) {
    await db.update(generalSpecialties).set({ isActive: false }).where(eq(generalSpecialties.id, id));
  },
};
