import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies, hiringCompanyPublicColumns as publicCols } from "../db/schema.js";
import type { CreateCompanyInput, UpdateCompanyInput } from "../schemas/company.schema.js";

const MAX_CODE_ATTEMPTS = 5;

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

// Next code after the highest existing "AGnnn". Using max (not count) means
// deleted companies don't make codes repeat; two inserts racing for the same
// code retry on the unique violation.
async function nextHiringCode(): Promise<string> {
  const [{ maxSeq }] = await db
    .select({
      maxSeq: sql<number>`coalesce(max(substring(${hiringCompanies.uniqueCode} from '^AG([0-9]+)$')::int), 0)`,
    })
    .from(hiringCompanies);
  return `AG${(Number(maxSeq) + 1).toString().padStart(3, "0")}`;
}

/** Insert a hiring company with the next free unique code. */
export async function insertHiringCompany(values: Omit<typeof hiringCompanies.$inferInsert, "uniqueCode">) {
  for (let attempt = 1; ; attempt++) {
    try {
      const [company] = await db
        .insert(hiringCompanies)
        .values({ ...values, uniqueCode: await nextHiringCode() })
        .returning(publicCols);
      return company;
    } catch (err) {
      if (!isUniqueViolation(err) || attempt >= MAX_CODE_ATTEMPTS) throw err;
    }
  }
}

export const companyService = {
  async list() {
    return db.select(publicCols).from(hiringCompanies).orderBy(hiringCompanies.createdAt);
  },

  async getById(id: string) {
    const [company] = await db
      .select(publicCols)
      .from(hiringCompanies)
      .where(eq(hiringCompanies.id, id));
    return company ?? null;
  },

  async getByCode(code: string) {
    const [company] = await db
      .select(publicCols)
      .from(hiringCompanies)
      .where(eq(hiringCompanies.uniqueCode, code));
    return company ?? null;
  },

  async create(data: CreateCompanyInput) {
    // Created by super admin → already confirmed.
    return insertHiringCompany({ ...data, isConfirmed: true });
  },

  async updateMine(id: string, data: UpdateCompanyInput) {
    return this.update(id, data);
  },

  async update(id: string, data: UpdateCompanyInput) {
    const [company] = await db
      .update(hiringCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hiringCompanies.id, id))
      .returning(publicCols);
    return company ?? null;
  },
};
