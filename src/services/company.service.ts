import { count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies } from "../db/schema.js";
import type { CreateCompanyInput, UpdateCompanyInput } from "../schemas/company.schema.js";

export const companyService = {
  async list() {
    return db.select().from(hiringCompanies).orderBy(hiringCompanies.createdAt);
  },

  async getById(id: string) {
    const [company] = await db
      .select()
      .from(hiringCompanies)
      .where(eq(hiringCompanies.id, id));
    return company ?? null;
  },

  async getByCode(code: string) {
    const [company] = await db
      .select()
      .from(hiringCompanies)
      .where(eq(hiringCompanies.uniqueCode, code));
    return company ?? null;
  },

  async create(data: CreateCompanyInput) {
    const [{ total }] = await db.select({ total: count() }).from(hiringCompanies);
    const seq = (Number(total) + 1).toString().padStart(3, "0");
    const uniqueCode = `AG${seq}`;

    const [company] = await db
      .insert(hiringCompanies)
      .values({ ...data, uniqueCode, isConfirmed: true })
      .returning();
    return company;
  },

  async updateMine(id: string, data: UpdateCompanyInput) {
    return this.update(id, data);
  },

  async update(id: string, data: UpdateCompanyInput) {
    const [company] = await db
      .update(hiringCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hiringCompanies.id, id))
      .returning();
    return company ?? null;
  },
};
