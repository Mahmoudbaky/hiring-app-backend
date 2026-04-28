import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.FRONTEND_URL?.replace("5173", "3000") ??
    "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
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
    },
  },
  trustedOrigins: [
    "https://hiring-app-peach.vercel.app",
    "http://localhost:5173",
  ],
});

export type Auth = typeof auth;
