/**
 * One-off migration: merge the hiring_* and client_* better-auth tables into
 * the single company_* table set, and add the new OTP columns.
 *
 *   pnpm migrate:company-auth            # dry run — prints what would happen
 *   pnpm migrate:company-auth --apply    # runs everything in one transaction
 *
 * Afterwards run `pnpm db:push`. It should only offer to drop the old
 * hiring_user / client_user / *_session / *_account / *_verification tables.
 * Accept that once you've checked the app works.
 *
 * - User ids and password hashes are copied unchanged, so passwords keep working.
 * - Sessions are NOT copied: every company user signs in once more.
 * - Pending OTP codes are cleared (they were stored in plain text); users ask
 *   for a new code.
 * - Users with no company, or whose email exists in both portals, are skipped
 *   and listed so you can fix them by hand.
 */
import "../lib/env.js";
import { neon } from "@neondatabase/serverless";

const apply = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL!);

async function tableExists(name: string) {
  const rows = await sql.query(`select to_regclass($1) as t`, [`public.${name}`]);
  return rows[0]?.t !== null;
}

async function main() {
  const hasOld = (await tableExists("hiring_user")) && (await tableExists("client_user"));
  if (!hasOld) {
    console.log("hiring_user / client_user not found — nothing to migrate.");
    return;
  }

  // ── Pre-flight report ─────────────────────────
  const [counts] = await sql.query(`
    select
      (select count(*) from hiring_user)::int                                as hiring_users,
      (select count(*) from client_user)::int                                as client_users,
      (select count(*) from hiring_user where hiring_company_id is null)::int as hiring_orphans,
      (select count(*) from client_user where client_company_id is null)::int as client_orphans
  `);
  const orphans = await sql.query(`
    select 'hiring' as portal, id, email from hiring_user where hiring_company_id is null
    union all
    select 'client', id, email from client_user where client_company_id is null
  `);
  const dupes = await sql.query(`
    select lower(h.email) as email from hiring_user h join client_user c on lower(c.email) = lower(h.email)
  `);

  console.log("Pre-flight:", counts);
  if (orphans.length) {
    console.log("\nSkipped — user has no company (created via the old open sign-up?):");
    console.table(orphans);
  }
  if (dupes.length) {
    console.log("\nEmail exists in BOTH portals — only the hiring account is kept:");
    console.table(dupes);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to migrate.");
    return;
  }

  // ── Migration (one transaction) ───────────────
  const q = (text: string) => sql.query(text);
  await sql.transaction([
    q(`do $$ begin
         create type company_type as enum ('hiring', 'client');
       exception when duplicate_object then null; end $$`),

    // OTP hardening columns (both company tables)
    ...["hiring_companies", "client_companies"].flatMap((t) => [
      q(`alter table ${t} alter column otp_code type varchar(64)`),
      q(`alter table ${t} add column if not exists otp_attempts integer not null default 0`),
      q(`alter table ${t} add column if not exists otp_sent_at timestamp`),
      q(`update ${t} set otp_code = null, otp_expires_at = null`),
    ]),

    q(`create table if not exists company_user (
         id text primary key,
         name text not null,
         email text not null,
         email_verified boolean not null,
         image text,
         phone_number varchar(30),
         is_frozen boolean not null default false,
         company_type company_type not null,
         hiring_company_id uuid,
         client_company_id uuid,
         created_at timestamp not null,
         updated_at timestamp not null,
         constraint company_user_email_unique unique (email),
         constraint company_user_hiring_company_id_hiring_companies_id_fk
           foreign key (hiring_company_id) references hiring_companies(id),
         constraint company_user_client_company_id_client_companies_id_fk
           foreign key (client_company_id) references client_companies(id),
         constraint company_user_company_matches_type check (
           (company_type = 'hiring' and hiring_company_id is not null and client_company_id is null)
           or (company_type = 'client' and client_company_id is not null and hiring_company_id is null)
         )
       )`),
    q(`create table if not exists company_session (
         id text primary key,
         expires_at timestamp not null,
         token text not null,
         created_at timestamp not null,
         updated_at timestamp not null,
         ip_address text,
         user_agent text,
         user_id text not null,
         constraint company_session_token_unique unique (token),
         constraint company_session_user_id_company_user_id_fk
           foreign key (user_id) references company_user(id) on delete cascade
       )`),
    q(`create table if not exists company_account (
         id text primary key,
         account_id text not null,
         provider_id text not null,
         user_id text not null,
         access_token text,
         refresh_token text,
         id_token text,
         access_token_expires_at timestamp,
         refresh_token_expires_at timestamp,
         scope text,
         password text,
         created_at timestamp not null,
         updated_at timestamp not null,
         constraint company_account_user_id_company_user_id_fk
           foreign key (user_id) references company_user(id) on delete cascade
       )`),
    q(`create table if not exists company_verification (
         id text primary key,
         identifier text not null,
         value text not null,
         expires_at timestamp not null,
         created_at timestamp,
         updated_at timestamp
       )`),

    // Copy users (hiring first, so it wins a duplicate email)
    q(`insert into company_user (id, name, email, email_verified, image, phone_number, is_frozen,
                                 company_type, hiring_company_id, client_company_id, created_at, updated_at)
       select id, name, lower(email), email_verified, image, phone_number, is_frozen,
              'hiring', hiring_company_id, null, created_at, updated_at
       from hiring_user where hiring_company_id is not null
       on conflict do nothing`),
    q(`insert into company_user (id, name, email, email_verified, image, phone_number, is_frozen,
                                 company_type, hiring_company_id, client_company_id, created_at, updated_at)
       select id, name, lower(email), email_verified, image, phone_number, is_frozen,
              'client', null, client_company_id, created_at, updated_at
       from client_user where client_company_id is not null
       on conflict do nothing`),

    // Copy credential accounts of the users that were copied
    q(`insert into company_account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token,
                                    access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
       select a.id, a.account_id, a.provider_id, a.user_id, a.access_token, a.refresh_token, a.id_token,
              a.access_token_expires_at, a.refresh_token_expires_at, a.scope, a.password, a.created_at, a.updated_at
       from hiring_account a
       join company_user u on u.id = a.user_id and u.company_type = 'hiring'
       on conflict do nothing`),
    q(`insert into company_account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token,
                                    access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
       select a.id, a.account_id, a.provider_id, a.user_id, a.access_token, a.refresh_token, a.id_token,
              a.access_token_expires_at, a.refresh_token_expires_at, a.scope, a.password, a.created_at, a.updated_at
       from client_account a
       join company_user u on u.id = a.user_id and u.company_type = 'client'
       on conflict do nothing`),

    // job_requests.submitted_by_user_id now points at company_user
    q(`do $$ declare c record; begin
         for c in
           select con.conname from pg_constraint con
           join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
           where con.conrelid = 'job_requests'::regclass and con.contype = 'f'
             and att.attname = 'submitted_by_user_id'
         loop
           execute format('alter table job_requests drop constraint %I', c.conname);
         end loop;
       end $$`),
    q(`update job_requests set submitted_by_user_id = null
       where submitted_by_user_id is not null
         and submitted_by_user_id not in (select id from company_user)`),
    q(`alter table job_requests
         add constraint job_requests_submitted_by_user_id_company_user_id_fk
         foreign key (submitted_by_user_id) references company_user(id)`),
  ]);

  const [after] = await sql.query(`
    select (select count(*) from company_user)::int    as company_users,
           (select count(*) from company_account)::int as company_accounts
  `);
  console.log("\n✔ Migrated:", after);
  console.log("Next: run `pnpm db:push` and accept dropping the old hiring_*/client_* auth tables.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
