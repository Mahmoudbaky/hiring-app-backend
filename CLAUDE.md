# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This backend is in early scaffold phase. The two source files (`src/index.ts`, `src/db/schema.ts`) are currently empty. No HTTP server, no API routes, no DB schema, and no auth handlers have been implemented yet.

## Stack

- **Runtime:** Node.js (CommonJS, `"type": "commonjs"`)
- **Language:** TypeScript, executed via `tsx` (no compiled output yet)
- **Database:** PostgreSQL on Neon serverless (`@neondatabase/serverless`)
- **ORM:** Drizzle ORM — schema in `src/db/schema.ts`, migrations via `drizzle-kit`
- **Auth:** `better-auth` with `@better-auth/infra`
- **Package manager:** pnpm

## Commands

There are currently no `dev`, `build`, or `lint` scripts in `package.json`. Add them before running. Typical setup:

```bash
pnpm install
pnpm dev          # after adding: "dev": "tsx src/index.ts"
pnpm db:push      # after adding: "db:push": "drizzle-kit push"
pnpm db:migrate   # after adding: "db:migrate": "drizzle-kit migrate"
pnpm db:studio    # after adding: "db:studio": "drizzle-kit studio"
```

## Environment

Requires a `.env` file at the project root with:

```
DATABASE_URL=postgresql://...   # Neon pooler connection string
```

## Architecture to Build

### Database (`src/db/`)
- `schema.ts` — Drizzle table definitions (use `pgTable` from `drizzle-orm/pg-core`)
- `index.ts` — Neon client + Drizzle instance export

Connect to Neon:
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Drizzle Config
A `drizzle.config.ts` at the project root is needed for migrations:
```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Auth (`better-auth`)
`better-auth` generates its own DB tables. Initialize it with the Drizzle adapter and point to the same DB instance. Its handler mounts at `/api/auth/*`.

### Data Models (from frontend)
The frontend expects these entities:

- **Job** — title, department, type (full-time/part-time/contract), remote flag, salary range, applicant count, published flag
- **Application** — applicant name, email, location, job reference, status (`new | review | shortlisted | interview | rejected`), resume attachment, avatar
- **User** — managed by `better-auth`

## Frontend Context

The companion frontend lives at `../hiring-app-frontend/` (React 19 + Vite + TailwindCSS 4 + shadcn/ui). The UI is Arabic-first (RTL). The API this backend exposes must align with the data shapes the frontend already uses.
