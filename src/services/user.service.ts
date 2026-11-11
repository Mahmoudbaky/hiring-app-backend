import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { companyUsers, hiringCompanies, clientCompanies } from "../db/schema.js";
import { companyAuth, createCredentialUser } from "../lib/auth.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors.js";
import type { UpdateUserInput } from "../schemas/user.schema.js";

const userFields = {
  id: companyUsers.id,
  name: companyUsers.name,
  email: companyUsers.email,
  phoneNumber: companyUsers.phoneNumber,
  isFrozen: companyUsers.isFrozen,
  companyType: companyUsers.companyType,
  hiringCompanyId: companyUsers.hiringCompanyId,
  clientCompanyId: companyUsers.clientCompanyId,
  createdAt: companyUsers.createdAt,
} as const;

export type CreateCompanyUserInput = {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  companyType: "hiring" | "client";
  companyId: string;
};

/** Create a company user already attached to its company. */
export async function createCompanyUser(data: CreateCompanyUserInput) {
  const table = data.companyType === "hiring" ? hiringCompanies : clientCompanies;
  const [company] = await db.select({ id: table.id }).from(table).where(eq(table.id, data.companyId));
  if (!company) throw new NotFoundError("الشركة غير موجودة");

  const [existing] = await db
    .select({ id: companyUsers.id })
    .from(companyUsers)
    .where(eq(companyUsers.email, data.email));
  if (existing) throw new ConflictError("البريد الإلكتروني مستخدم بالفعل");

  const user = await createCredentialUser(companyAuth, {
    name: data.name,
    email: data.email,
    password: data.password,
    extra: {
      companyType: data.companyType,
      hiringCompanyId: data.companyType === "hiring" ? data.companyId : null,
      clientCompanyId: data.companyType === "client" ? data.companyId : null,
      phoneNumber: data.phoneNumber ?? null,
    },
  });

  const [created] = await db.select(userFields).from(companyUsers).where(eq(companyUsers.id, user.id));
  return created;
}

export const userService = {
  // Users of one hiring company (used by company_user for their own company).
  async list(hiringCompanyId: string | null | undefined) {
    if (!hiringCompanyId) return [];
    return db
      .select(userFields)
      .from(companyUsers)
      .where(eq(companyUsers.hiringCompanyId, hiringCompanyId))
      .orderBy(companyUsers.createdAt);
  },

  // Super admin: every company user (hiring + client) with its company name.
  async listAll() {
    const rows = await db
      .select({
        ...userFields,
        hiringCompanyName: hiringCompanies.companyName,
        clientCompanyName: clientCompanies.companyName,
      })
      .from(companyUsers)
      .leftJoin(hiringCompanies, eq(companyUsers.hiringCompanyId, hiringCompanies.id))
      .leftJoin(clientCompanies, eq(companyUsers.clientCompanyId, clientCompanies.id))
      .orderBy(desc(companyUsers.createdAt));

    return rows.map(({ hiringCompanyName, clientCompanyName, ...r }) => ({
      ...r,
      companyId: r.companyType === "hiring" ? r.hiringCompanyId : r.clientCompanyId,
      companyName: r.companyType === "hiring" ? hiringCompanyName : clientCompanyName,
      role: r.companyType === "hiring" ? ("company_user" as const) : ("client_company_user" as const),
    }));
  },

  create: createCompanyUser,

  async update(id: string, data: UpdateUserInput) {
    const { hiringCompanyId, ...rest } = data;

    // Moving a user to another hiring company is only valid for hiring users;
    // the DB CHECK constraint forbids a null company.
    if (hiringCompanyId !== undefined) {
      const [current] = await db
        .select({ companyType: companyUsers.companyType })
        .from(companyUsers)
        .where(eq(companyUsers.id, id));
      if (!current) return null;
      if (current.companyType !== "hiring" || !hiringCompanyId) {
        throw new BadRequestError("لا يمكن تغيير شركة هذا المستخدم");
      }
    }

    const [updated] = await db
      .update(companyUsers)
      .set({
        ...rest,
        ...(hiringCompanyId ? { hiringCompanyId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(companyUsers.id, id))
      .returning(userFields);

    // Freezing must take effect now: end the user's sessions.
    if (updated && data.isFrozen) await revokeSessions(id);
    return updated ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(companyUsers)
      .where(eq(companyUsers.id, id))
      .returning({ id: companyUsers.id });
    return deleted ?? null;
  },
};

async function revokeSessions(userId: string) {
  const ctx = await companyAuth.$context;
  await ctx.internalAdapter.deleteUserSessions(userId);
}
