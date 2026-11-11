import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { frontendUrls } from "./env.js";

// ─────────────────────────────────────────────
// Two isolated auth instances:
//
//   adminAuth   → /api/auth/admin    (super admins, cookie prefix "admin")
//   companyAuth → /api/auth/company  (hiring + client company users, prefix "company")
//
// Hiring and client users share one instance; which login page they may use is
// enforced at sign-in from the `x-portal` header ("hiring" | "client").
//
// Sign-up is disabled on both instances (no public /sign-up/email route).
// Accounts are only created by server code through createCredentialUser().
// ─────────────────────────────────────────────

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

if (process.env.NODE_ENV === "production" && !secret) {
  throw new Error("BETTER_AUTH_SECRET must be set in production");
}

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const sharedAdvanced: BetterAuthOptions["advanced"] = {
  useSecureCookies: process.env.NODE_ENV === "production",
  crossSubDomainCookies: { enabled: false },
  ...(process.env.NODE_ENV === "production" && {
    defaultCookieAttributes: {
      sameSite: "None",
      secure: true,
      httpOnly: true,
      partitioned: true, // this is for mobile login fix
    },
  }),
};

function forbidden(message: string): never {
  throw new APIError("FORBIDDEN", { message });
}

const sharedEmailAndPassword: BetterAuthOptions["emailAndPassword"] = {
  enabled: true,
  disableSignUp: true,
  minPasswordLength: PASSWORD_MIN,
  maxPasswordLength: PASSWORD_MAX,
};

// ── Admin ────────────────────────────────────

export const adminAuth = betterAuth({
  baseURL,
  basePath: "/api/auth/admin",
  secret,
  advanced: { ...sharedAdvanced, cookiePrefix: "admin" },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.adminUsers,
      session: schema.adminSessions,
      account: schema.adminAccounts,
      verification: schema.adminVerifications,
    },
  }),
  emailAndPassword: sharedEmailAndPassword,
  user: {
    additionalFields: {
      isFrozen: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Runs after the password has been verified, so it never reveals
        // whether an email exists.
        before: async (session) => {
          const [u] = await db
            .select({ isFrozen: schema.adminUsers.isFrozen })
            .from(schema.adminUsers)
            .where(eq(schema.adminUsers.id, session.userId));
          if (!u) forbidden("الحساب غير موجود");
          if (u.isFrozen) forbidden("تم تجميد حسابك");
        },
      },
    },
  },
  trustedOrigins: frontendUrls,
});

// ── Company (hiring + client) ────────────────

export type CompanyPortal = "hiring" | "client";

export type CompanyStatus = { isActive: boolean; isConfirmed: boolean } | null;

/** Look up the company a company user belongs to (either table). */
export async function getCompanyStatus(u: {
  companyType: CompanyPortal;
  hiringCompanyId: string | null;
  clientCompanyId: string | null;
}): Promise<CompanyStatus> {
  if (u.companyType === "hiring" && u.hiringCompanyId) {
    const [c] = await db
      .select({ isActive: schema.hiringCompanies.isActive, isConfirmed: schema.hiringCompanies.isConfirmed })
      .from(schema.hiringCompanies)
      .where(eq(schema.hiringCompanies.id, u.hiringCompanyId));
    return c ?? null;
  }
  if (u.companyType === "client" && u.clientCompanyId) {
    const [c] = await db
      .select({ isActive: schema.clientCompanies.isActive, isConfirmed: schema.clientCompanies.isConfirmed })
      .from(schema.clientCompanies)
      .where(eq(schema.clientCompanies.id, u.clientCompanyId));
    return c ?? null;
  }
  return null;
}

/** Throws a message for any reason a company user may not use the app. */
export function companyAccessError(isFrozen: boolean, company: CompanyStatus): string | null {
  if (isFrozen) return "تم تجميد حسابك";
  if (!company) return "الحساب غير مرتبط بأي شركة";
  if (!company.isConfirmed) return "لم يتم تأكيد بريد الشركة بعد، يرجى التحقق من بريدك الإلكتروني";
  if (!company.isActive) return "تم تجميد شركتك، يرجى التواصل مع المسؤول";
  return null;
}

export const companyAuth = betterAuth({
  baseURL,
  basePath: "/api/auth/company",
  secret,
  advanced: { ...sharedAdvanced, cookiePrefix: "company" },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.companyUsers,
      session: schema.companySessions,
      account: schema.companyAccounts,
      verification: schema.companyVerifications,
    },
  }),
  emailAndPassword: sharedEmailAndPassword,
  user: {
    // Only the server can set these (input: false).
    additionalFields: {
      companyType: { type: "string", required: true, input: false },
      hiringCompanyId: { type: "string", required: false, input: false },
      clientCompanyId: { type: "string", required: false, input: false },
      phoneNumber: { type: "string", required: false, input: false },
      isFrozen: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          const [u] = await db
            .select({
              companyType: schema.companyUsers.companyType,
              hiringCompanyId: schema.companyUsers.hiringCompanyId,
              clientCompanyId: schema.companyUsers.clientCompanyId,
              isFrozen: schema.companyUsers.isFrozen,
            })
            .from(schema.companyUsers)
            .where(eq(schema.companyUsers.id, session.userId));
          if (!u) forbidden("الحساب غير موجود");

          // Each login page sends its portal; a hiring user can't sign in on
          // the client page and vice versa.
          const portal = ctx?.headers?.get("x-portal");
          if (portal && portal !== u.companyType) {
            forbidden(
              u.companyType === "hiring"
                ? "هذا الحساب تابع لشركة توظيف، يرجى تسجيل الدخول من صفحة شركات التوظيف"
                : "هذا الحساب تابع لشركة عميلة، يرجى تسجيل الدخول من صفحة الشركات العميلة"
            );
          }

          const error = companyAccessError(u.isFrozen, await getCompanyStatus(u));
          if (error) forbidden(error);
        },
      },
    },
  },
  trustedOrigins: frontendUrls,
});

// ── Server-side account creation ─────────────

/**
 * Create a user + credential account directly through better-auth's internal
 * adapter (sign-up is disabled over HTTP). `extra` holds server-only fields
 * such as companyType / company ids. Rolls the user back if linking fails.
 */
export async function createCredentialUser(
  auth: typeof adminAuth | typeof companyAuth,
  data: { name: string; email: string; password: string; extra?: Record<string, unknown> }
) {
  const ctx = await auth.$context;
  const email = data.email.trim().toLowerCase();

  if (await ctx.internalAdapter.findUserByEmail(email)) {
    throw new APIError("UNPROCESSABLE_ENTITY", { code: "USER_ALREADY_EXISTS", message: "User already exists" });
  }
  if (data.password.length < PASSWORD_MIN || data.password.length > PASSWORD_MAX) {
    throw new APIError("BAD_REQUEST", { code: "INVALID_PASSWORD_LENGTH", message: "Invalid password length" });
  }

  const hash = await ctx.password.hash(data.password);
  const user = await ctx.internalAdapter.createUser({
    name: data.name,
    email,
    emailVerified: false,
    ...data.extra,
  }, { method: "admin" }); // server-provisioned account (better-auth ≥1.7 requires a source)
  if (!user) throw new Error("Failed to create user");

  try {
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hash,
    });
  } catch (err) {
    await ctx.internalAdapter.deleteUser(user.id);
    throw err;
  }
  return user;
}

export type AdminAuth = typeof adminAuth;
export type CompanyAuth = typeof companyAuth;
