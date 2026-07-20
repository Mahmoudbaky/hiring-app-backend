import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

// Role is no longer a column — it is implied by which portal (table set) a
// user belongs to: admin_user → super_admin, hiring_user → company_user,
// client_user → client_company_user.

export const adTypeEnum = pgEnum("ad_type", ["remote", "on_site", "hybrid"]);

export const genderEnum = pgEnum("gender", ["male", "female"]);

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "review",
  "shortlisted",
  "interview",
  "rejected",
  "hired",
]);

export const submissionTypeEnum = pgEnum("submission_type", [
  "self",   // applicant applied on his own
  "manual", // company user submitted on behalf of applicant
]);

// ─────────────────────────────────────────────
// Hiring Companies
// ─────────────────────────────────────────────

export const hiringCompanies = pgTable("hiring_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  uniqueCode: varchar("unique_code", { length: 50 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: text("address"),
  managerName: varchar("manager_name", { length: 255 }),
  companyRecord: text("company_record"),
  logo: text("logo"), // Cloudinary URL
  isAdminCompany: boolean("is_admin_company").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  otpCode: varchar("otp_code", { length: 6 }),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Client Companies (seek employees from shared talent pool)
// ─────────────────────────────────────────────

export const clientCompanies = pgTable("client_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: text("address"),
  managerName: varchar("manager_name", { length: 255 }),
  companyRecord: text("company_record"),
  logo: text("logo"),
  isActive: boolean("is_active").default(true).notNull(),
  isConfirmed: boolean("is_confirmed").default(false).notNull(),
  otpCode: varchar("otp_code", { length: 6 }),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Auth — three isolated portals (admin / hiring / client)
//
// Each portal has its own better-auth table set so the three account types
// live in physically separate tables and can only sign in on their own pages.
// Role is implied by the table: admin_user → super_admin,
// hiring_user → company_user, client_user → client_company_user.
// ─────────────────────────────────────────────

// ─── Admin portal (super admin) ──────────────

export const adminUsers = pgTable("admin_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const adminSessions = pgTable("admin_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
});

export const adminAccounts = pgTable("admin_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const adminVerifications = pgTable("admin_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Hiring portal (company users) ───────────

export const hiringUsers = pgTable("hiring_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  phoneNumber: varchar("phone_number", { length: 30 }),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  hiringCompanyId: uuid("hiring_company_id").references(
    () => hiringCompanies.id
  ),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const hiringSessions = pgTable("hiring_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => hiringUsers.id, { onDelete: "cascade" }),
});

export const hiringAccounts = pgTable("hiring_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => hiringUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const hiringVerifications = pgTable("hiring_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Client portal (client company users) ────

export const clientUsers = pgTable("client_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  phoneNumber: varchar("phone_number", { length: 30 }),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  clientCompanyId: uuid("client_company_id").references(
    () => clientCompanies.id
  ),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const clientSessions = pgTable("client_session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => clientUsers.id, { onDelete: "cascade" }),
});

export const clientAccounts = pgTable("client_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => clientUsers.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const clientVerifications = pgTable("client_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────
// Departments / Professional Grades / General Specialties
// ─────────────────────────────────────────────

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  hasExtraSpecialties: boolean("has_extra_specialties").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const professionalGrades = pgTable("professional_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generalSpecialties = pgTable("general_specialties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Settings (managed by super admin)
// ─────────────────────────────────────────────

export const jobTitleSettings = pgTable("job_title_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const qualificationTypeSettings = pgTable(
  "qualification_type_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(), // e.g. "Bachelor's", "Master's", "PhD"
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// ─────────────────────────────────────────────
// Job Advertisements  (created by super admin)
// ─────────────────────────────────────────────

export const jobAds = pgTable("job_ads", {
  id: uuid("id").primaryKey().defaultRandom(),
  adTitle: varchar("ad_title", { length: 255 }).notNull(),
  jobTitleId: uuid("job_title_id").references(() => jobTitleSettings.id),
  adType: adTypeEnum("ad_type").notNull(),
  salaryFrom: integer("salary_from"),
  salaryTo: integer("salary_to"),
  description: text("description"),
  isPublished: boolean("is_published").default(false).notNull(),
  deadline: timestamp("deadline"),
  createdBy: text("created_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Applicants  (no account — identified by email + phone)
// ─────────────────────────────────────────────

export const applicants = pgTable("applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 100 }),
  currentJobLocation: varchar("current_job_location", { length: 255 }),
  assignedClientCompanyId: uuid("assigned_client_company_id").references(
    () => clientCompanies.id
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Academic Qualifications  (1-to-many per applicant)
// ─────────────────────────────────────────────

export const academicQualifications = pgTable("academic_qualifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .references(() => applicants.id, { onDelete: "cascade" }),
  qualificationTypeId: uuid("qualification_type_id").references(
    () => qualificationTypeSettings.id
  ),
  yearObtained: integer("year_obtained"),
  instituteName: varchar("institute_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Job Requests / Applications
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Contact Messages  (public submission, super admin read)
// ─────────────────────────────────────────────

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// Client Company Applicant Tracking  (junction: status per client co per applicant)
// ─────────────────────────────────────────────

export const clientCompanyApplicants = pgTable(
  "client_company_applicants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientCompanyId: uuid("client_company_id")
      .notNull()
      .references(() => clientCompanies.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => applicants.id, { onDelete: "cascade" }),
    status: requestStatusEnum("status").default("new").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.clientCompanyId, t.applicantId)]
);

// ─────────────────────────────────────────────
export const jobRequests = pgTable(
  "job_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => applicants.id),
    jobAdId: uuid("job_ad_id").references(() => jobAds.id),
    hiringCompanyId: uuid("hiring_company_id")
      .notNull()
      .references(() => hiringCompanies.id),
    cvUrl: text("cv_url"),
    status: requestStatusEnum("status").default("new").notNull(),
    submissionType: submissionTypeEnum("submission_type")
      .default("self")
      .notNull(),
    // populated only when submissionType = 'manual'
    submittedByUserId: text("submitted_by_user_id").references(() => hiringUsers.id),
    notes: text("notes"),
    // job-profile fields (department / grade / specialty cascade)
    departmentId: uuid("department_id").references(() => departments.id),
    professionalGradeId: uuid("professional_grade_id").references(() => professionalGrades.id),
    generalSpecialtyId: uuid("general_specialty_id").references(() => generalSpecialties.id),
    referenceNumber: varchar("reference_number", { length: 20 }),
    yearsOfExperience: varchar("years_of_experience", { length: 50 }),
    additionalInfo: text("additional_info"),
    isViewedByAdmin: boolean("is_viewed_by_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  () => []
);
