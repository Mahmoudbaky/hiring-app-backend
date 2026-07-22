import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringUsers, clientUsers, hiringCompanies, clientCompanies } from "../db/schema.js";
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
  // Hiring-scoped list (used by company_user for their own company's users).
  async list(hiringCompanyId?: string | null) {
    return db
      .select(userFields)
      .from(hiringUsers)
      .where(hiringCompanyId ? eq(hiringUsers.hiringCompanyId, hiringCompanyId) : undefined)
      .orderBy(hiringUsers.createdAt);
  },

  // Cross-portal list (super admin): every company user from both portals,
  // annotated with its company + portal type.
  async listAll() {
    const hiringRows = await db
      .select({
        id: hiringUsers.id,
        name: hiringUsers.name,
        email: hiringUsers.email,
        phoneNumber: hiringUsers.phoneNumber,
        isFrozen: hiringUsers.isFrozen,
        companyId: hiringUsers.hiringCompanyId,
        companyName: hiringCompanies.companyName,
        createdAt: hiringUsers.createdAt,
      })
      .from(hiringUsers)
      .leftJoin(hiringCompanies, eq(hiringUsers.hiringCompanyId, hiringCompanies.id));

    const clientRows = await db
      .select({
        id: clientUsers.id,
        name: clientUsers.name,
        email: clientUsers.email,
        phoneNumber: clientUsers.phoneNumber,
        isFrozen: clientUsers.isFrozen,
        companyId: clientUsers.clientCompanyId,
        companyName: clientCompanies.companyName,
        createdAt: clientUsers.createdAt,
      })
      .from(clientUsers)
      .leftJoin(clientCompanies, eq(clientUsers.clientCompanyId, clientCompanies.id));

    const hiring = hiringRows.map((r) => ({
      ...r,
      companyType: "hiring" as const,
      role: "company_user" as const,
    }));
    const client = clientRows.map((r) => ({
      ...r,
      companyType: "client" as const,
      role: "client_company_user" as const,
    }));

    return [...hiring, ...client].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  // Update a user in whichever portal owns the id (hiring first, then client).
  async update(id: string, data: UpdateUserInput) {
    const [hiring] = await db
      .update(hiringUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hiringUsers.id, id))
      .returning(userFields);
    if (hiring) return hiring;

    // Client users have no hiringCompanyId — only apply the shared fields.
    const [client] = await db
      .update(clientUsers)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        ...(data.isFrozen !== undefined ? { isFrozen: data.isFrozen } : {}),
        updatedAt: new Date(),
      })
      .where(eq(clientUsers.id, id))
      .returning({
        id: clientUsers.id,
        name: clientUsers.name,
        email: clientUsers.email,
        phoneNumber: clientUsers.phoneNumber,
        isFrozen: clientUsers.isFrozen,
        createdAt: clientUsers.createdAt,
      });
    return client ?? null;
  },

  async remove(id: string) {
    const [hiring] = await db
      .delete(hiringUsers)
      .where(eq(hiringUsers.id, id))
      .returning({ id: hiringUsers.id });
    if (hiring) return hiring;

    const [client] = await db
      .delete(clientUsers)
      .where(eq(clientUsers.id, id))
      .returning({ id: clientUsers.id });
    return client ?? null;
  },
};
