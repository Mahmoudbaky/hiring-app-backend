import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

// ─────────────────────────────────────────────
// Three isolated auth portals (admin / hiring / client)
//
// Each portal is its own better-auth instance backed by its own table set,
// mounted at its own basePath and using its own cookie prefix so the three
// session cookies never collide. Role is implied by the portal.
// ─────────────────────────────────────────────

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET;

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

type PortalSchema = {
  user: any;
  session: any;
  account: any;
  verification: any;
};

function makeAuth(opts: {
  basePath: string;
  cookiePrefix: string;
  schema: PortalSchema;
  additionalFields?: Record<string, any>;
}) {
  return betterAuth({
    baseURL,
    basePath: opts.basePath,
    secret,
    advanced: {
      ...sharedAdvanced,
      cookiePrefix: opts.cookiePrefix,
    },
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: opts.schema.user,
        session: opts.schema.session,
        account: opts.schema.account,
        verification: opts.schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: (opts.additionalFields ?? {}) as any,
    },
    trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
  });
}

export const adminAuth = makeAuth({
  basePath: "/api/auth/admin",
  cookiePrefix: "admin",
  schema: {
    user: schema.adminUsers,
    session: schema.adminSessions,
    account: schema.adminAccounts,
    verification: schema.adminVerifications,
  },
});

export const hiringAuth = makeAuth({
  basePath: "/api/auth/hiring",
  cookiePrefix: "hiring",
  schema: {
    user: schema.hiringUsers,
    session: schema.hiringSessions,
    account: schema.hiringAccounts,
    verification: schema.hiringVerifications,
  },
  additionalFields: {
    hiringCompanyId: {
      type: "string",
      required: false,
      // only the server (not the client) can set this
      input: false,
    },
  },
});

export const clientAuth = makeAuth({
  basePath: "/api/auth/client",
  cookiePrefix: "client",
  schema: {
    user: schema.clientUsers,
    session: schema.clientSessions,
    account: schema.clientAccounts,
    verification: schema.clientVerifications,
  },
  additionalFields: {
    clientCompanyId: {
      type: "string",
      required: false,
      input: false,
    },
  },
});

export type AdminAuth = typeof adminAuth;
export type HiringAuth = typeof hiringAuth;
export type ClientAuth = typeof clientAuth;
