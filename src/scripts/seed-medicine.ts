/**
 * Seed Medicine sector with its General Specialties and Professional Grades.
 * Idempotent — skips each table if rows already exist for this department.
 *
 * Run:  pnpm seed:medicine
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { departments, professionalGrades, generalSpecialties } from "../db/schema.js";

// ── Department ────────────────────────────────────────────────────────────────

const DEPARTMENT_NAME = "الطب البشري";

// ── Professional Grades (same for all specialties in this sector) ─────────────

const PROFESSIONAL_GRADES = [
  "استشاري",
  "نائب أول",
  "نائب",
  "مقيم",
  "طبيب عام",
];

// ── General Specialties ───────────────────────────────────────────────────────

const GENERAL_SPECIALTIES = [
  "الجراحة العامة",
  "أمراض الجهاز الهضمي والكبد",
  "طب الأطفال",
  "النساء والولادة",
  "طب الطوارئ",
  "طب الأسرة",
  "التخدير",
  "الأشعة التشخيصية",
  "الطب النفسي",
  "طب العيون",
  "الأنف والأذن والحنجرة",
  "طب المختبرات",
  "جراحة العظام",
  "جراحة المخ والأعصاب",
  "أمراض القلب",
  "الأمراض الجلدية والتناسلية",
  "الأورام والعلاج الإشعاعي",
  "أمراض الأعصاب",
  "أمراض الجهاز التنفسي والصدرية",
  "أمراض الكلى",
  "أمراض المسالك البولية",
  "الصحة العامة وطب المجتمع",
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Upsert department
  console.log(`Seeding department: ${DEPARTMENT_NAME}...`);
  const [existingDept] = await db
    .select()
    .from(departments)
    .where(eq(departments.name, DEPARTMENT_NAME));

  let deptId: string;

  if (existingDept) {
    deptId = existingDept.id;
    console.log(`  ℹ Already exists (id: ${deptId})`);
  } else {
    const [created] = await db
      .insert(departments)
      .values({ name: DEPARTMENT_NAME })
      .returning();
    deptId = created.id;
    console.log(`  ✔ Created (id: ${deptId})`);
  }

  // 2. Seed professional grades
  console.log("Seeding professional grades...");
  const existingGrades = await db
    .select()
    .from(professionalGrades)
    .where(eq(professionalGrades.departmentId, deptId));

  if (existingGrades.length > 0) {
    console.log(`  ℹ Skipped — ${existingGrades.length} grades already exist for this department`);
  } else {
    const inserted = await db
      .insert(professionalGrades)
      .values(PROFESSIONAL_GRADES.map((name) => ({ name, departmentId: deptId })))
      .returning();
    console.log(`  ✔ ${inserted.length} professional grades inserted`);
  }

  // 3. Seed general specialties
  console.log("Seeding general specialties...");
  const existingSpecialties = await db
    .select()
    .from(generalSpecialties)
    .where(eq(generalSpecialties.departmentId, deptId));

  if (existingSpecialties.length > 0) {
    console.log(`  ℹ Skipped — ${existingSpecialties.length} specialties already exist for this department`);
  } else {
    const inserted = await db
      .insert(generalSpecialties)
      .values(GENERAL_SPECIALTIES.map((name) => ({ name, departmentId: deptId })))
      .returning();
    console.log(`  ✔ ${inserted.length} general specialties inserted`);
  }

  console.log("\nDone! Fetch them at:");
  console.log("  GET /api/settings/departments/public");
  console.log("  GET /api/settings/professional-grades/public?departmentId=<id>");
  console.log("  GET /api/settings/general-specialties/public?departmentId=<id>");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
