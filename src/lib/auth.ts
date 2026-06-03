import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
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
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "company_user",
        // only the server (not the client) can set this
        input: false,
      },
      hiringCompanyId: {
        type: "string",
        required: false,
        input: false,
      },
      clientCompanyId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
});

export type Auth = typeof auth;
