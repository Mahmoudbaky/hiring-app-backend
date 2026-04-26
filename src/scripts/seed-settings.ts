/**
 * Seed example job titles and qualification types.
 * Run after pnpm db:push:
 *   pnpm tsx src/scripts/seed-settings.ts
 */

import "dotenv/config";
import { db } from "../db/index.js";
import { jobTitleSettings, qualificationTypeSettings } from "../db/schema.js";

const JOB_TITLES = [
  "طبيب عام",
  "طبيب أسنان",
  "طبيب عيون",
  "طبيب جراح",
  "طبيب نساء وتوليد",
  "طبيب أطفال",
  "صيدلاني",
  "ممرض / ممرضة",
  "أخصائي تحاليل طبية",
  "أخصائي أشعة",
  "مدير طبي",
  "مدير مستشفى",
  "مسؤول موارد بشرية",
  "محاسب",
  "مهندس",
  "مبرمج",
  "مصمم جرافيك",
  "مدير مبيعات",
  "موظف استقبال",
  "سائق",
];

const QUALIFICATION_TYPES = [
  "شهادة الثانوية العامة",
  "دبلوم تقني",
  "بكالوريوس",
  "ليسانس",
  "ماجستير",
  "دكتوراه",
  "بورد طبي",
  "زمالة طبية",
  "شهادة مهنية",
  "دورة تدريبية معتمدة",
];

async function main() {
  console.log("Seeding job titles...");
  const existingTitles = await db.select().from(jobTitleSettings);
  if (existingTitles.length > 0) {
    console.log(`  ℹ Skipped — ${existingTitles.length} job titles already exist`);
  } else {
    const insertedTitles = await db
      .insert(jobTitleSettings)
      .values(JOB_TITLES.map((title) => ({ title })))
      .returning();
    console.log(`  ✔ ${insertedTitles.length} job titles inserted`);
  }

  console.log("Seeding qualification types...");
  const existingTypes = await db.select().from(qualificationTypeSettings);
  if (existingTypes.length > 0) {
    console.log(`  ℹ Skipped — ${existingTypes.length} qualification types already exist`);
  } else {
    const insertedTypes = await db
      .insert(qualificationTypeSettings)
      .values(QUALIFICATION_TYPES.map((name) => ({ name })))
      .returning();
    console.log(`  ✔ ${insertedTypes.length} qualification types inserted`);
  }

  console.log("\nDone! Fetch them at:");
  console.log("  GET /api/settings/job-titles");
  console.log("  GET /api/settings/qualification-types");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
