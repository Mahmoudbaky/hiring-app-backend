# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Runtime:** Node.js with TypeScript (`tsx` for dev, `tsc` for build)
- **Framework:** Express 5
- **Database:** PostgreSQL on Neon serverless via `@neondatabase/serverless` + Drizzle ORM
- **Auth:** `better-auth` (email+password, Drizzle adapter), sessions at `/api/auth/*`
- **Validation:** Zod schemas in `src/schemas/`
- **Docs:** Swagger UI at `/api/docs`, OpenAPI spec at `/api/docs.json`
- **Package manager:** pnpm

## Commands

```bash
pnpm dev              # tsx watch src/index.ts (port 3000)
pnpm build            # tsc → dist/
pnpm start            # node dist/index.js
pnpm typecheck        # tsc --noEmit
pnpm db:push          # push schema changes to Neon (dev)
pnpm db:migrate       # run migrations
pnpm db:studio        # Drizzle Studio UI
pnpm seed:admin       # create super admin + admin company (idempotent)
pnpm seed:settings    # insert Arabic job titles & qualification types (idempotent)
```

## Environment

```
DATABASE_URL=postgresql://...    # Neon pooler connection string
FRONTEND_URL=http://localhost:5173
PORT=3000
SUPER_ADMIN_EMAIL=...            # used by seed:admin
SUPER_ADMIN_PASSWORD=...
```

## Architecture

### Request Flow
```
Route → validate middleware (Zod) → requireAuth / requireRole → Controller → Service → DB (Drizzle)
```

- **Routes** (`src/routes/`) — wire middleware and controllers together
- **Controllers** (`src/controllers/`) — parse req, call service, return `sendSuccess` / throw errors
- **Services** (`src/services/`) — all business logic and DB queries
- **Schemas** (`src/schemas/`) — Zod validation schemas, one file per resource

### Response Format

All responses use helpers from `src/utils/response.ts`:

```ts
// Success
{ success: true, message: string, data: T, timestamp: string }

// Error (from errorHandler middleware)
{ success: false, message: string, timestamp: string, errors?: { field: string[] } }
```

### Auth & Roles

Two roles: `super_admin` and `company_user`. Role is stored on the `user` table alongside `hiringCompanyId`.

- `requireAuth` — validates better-auth session, attaches user to `req.user`
- `requireRole("super_admin")` — role guard, returns 403 if wrong role

Company users are scoped to their `hiringCompanyId` — services filter DB queries accordingly. Super admins see all data.

### Database Schema

10 tables in `src/db/schema.ts`:

| Table | Purpose |
|---|---|
| `hiring_companies` | Hiring orgs, each with a unique `uniqueCode` |
| `user` | better-auth user table + `role`, `hiringCompanyId` |
| `session`, `account`, `verification` | better-auth internal tables |
| `job_ads` | Job postings (published flag, salary range, deadline) |
| `applicants` | Job candidates (identified by email+phone, no account) |
| `academic_qualifications` | 1-to-many education records per applicant |
| `job_requests` | Applications linking applicants to job ads; status: `new→review→shortlisted→interview→rejected→hired` |
| `job_title_settings` | Dropdown options for job titles (soft-delete) |
| `qualification_type_settings` | Dropdown options for education levels (soft-delete) |

### Key Business Logic

**Self-apply flow** (`POST /api/requests`) — public endpoint:
1. Validate `hiringCompanyCode` exists and job is published
2. Upsert applicant by email — reuse existing, create if new
3. Insert qualifications only for new applicants
4. Reject duplicate applications (same applicant + job)

**Company scoping** — `company_user` can only see requests/applicants tied to their `hiringCompanyId`. Services check this via joined queries.

**Settings** — job titles and qualification types use soft delete (`isActive: false`), not hard deletes.

### Error Classes

`src/utils/errors.ts` exports `AppError` subclasses: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409). Throw these in services; the global `errorHandler` middleware formats them.

> Note: `src/lib/errors.ts` also exists as a legacy duplicate — prefer `src/utils/errors.ts`.

## Frontend Context

Companion frontend at `../hiring-app-frontend/` (React 19 + Vite + TailwindCSS 4 + shadcn/ui). UI is Arabic-first (RTL). Seed data (job titles, qualification types) is in Arabic.
