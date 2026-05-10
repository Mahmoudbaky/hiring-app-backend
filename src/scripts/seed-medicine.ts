/**
 * Seed all healthcare departments with their General Specialties and Professional Grades.
 * Idempotent — each department is skipped if it already exists by name.
 *
 * Run:  pnpm seed:medicine
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { departments, professionalGrades, generalSpecialties } from "../db/schema.js";

// ── Data ─────────────────────────────────────────────────────────────────────

const SECTORS: Array<{
  name: string;
  grades: string[];
  specialties: string[];
}> = [
  {
    name: "الطب البشري",
    grades: ["استشاري", "نائب أول", "نائب", "مقيم", "طبيب عام"],
    specialties: [
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
    ],
  },
  {
    name: "طب الأسنان",
    grades: [
      "طبيب استشاري",
      "طبيب نائب أول",
      "طبيب نائب",
      "طبيب مقيم",
      "طبيب أسنان عام",
    ],
    specialties: [
      "طب الأسنان العام",
      "تقويم الأسنان",
      "جراحة الوجه والفكين",
      "طب أسنان الأطفال",
      "علاج اللثة",
      "الاستعاضة السنية",
      "علاج عصب الأسنان",
      "إصلاح الأسنان",
      "تركيبات الأسنان",
      "علاج جذور الأسنان",
    ],
  },
  {
    name: "العلوم الطبية التطبيقية",
    grades: ["استشاري", "أخصائي أول", "أخصائي", "فني", "مساعد فني"],
    specialties: [
      "المختبرات الطبية",
      "الأشعة والتصوير الطبي",
      "العلاج الطبيعي",
      "العلاج الوظيفي",
      "النطق والسمع",
      "التغذية الإكلينيكية",
      "الرعاية التنفسية",
      "الخدمات الطبية الطارئة",
      "التخدير",
      "البصريات",
      "التروية القلبية",
      "تقنية القسطرة القلبية",
      "الأطراف الصناعية والأجهزة التعويضية",
      "تخطيط المخ والأعصاب",
      "التعقيم المركزي",
      "رعاية فم وأسنان",
      "علم الأمراض",
      "الإسعافات الأولية والطوارئ",
    ],
  },
  {
    name: "التمريض",
    grades: ["استشاري", "أخصائي أول", "أخصائي", "فني", "مساعد صحي"],
    specialties: [
      "التمريض العام",
      "تمريض العناية المركزة",
      "تمريض الطوارئ",
      "تمريض القبالة",
      "تمريض الأطفال",
      "تمريض الصحة العامة",
      "تمريض العمليات الجراحية",
    ],
  },
  {
    name: "الصيدلة",
    grades: ["صيدلي استشاري", "صيدلي أول", "صيدلي", "فني صيدلة"],
    specialties: [
      "الصيدلة الإكلينيكية",
      "صيدلة المستشفيات",
      "علم الأدوية",
    ],
  },
  {
    name: "الإدارة الصحية",
    grades: ["أخصائي أول", "أخصائي", "فني"],
    specialties: [
      "الإدارة الصحية",
      "المعلوماتية الصحية",
      "السجلات الطبية",
      "الجودة الصحية",
      "الترميز الطبي",
    ],
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────

async function seedSector(sector: (typeof SECTORS)[number]) {
  console.log(`\n▶ ${sector.name}`);

  // Upsert department
  const [existing] = await db
    .select()
    .from(departments)
    .where(eq(departments.name, sector.name));

  let deptId: string;

  if (existing) {
    deptId = existing.id;
    console.log(`  القطاع: موجود بالفعل`);
  } else {
    const [created] = await db
      .insert(departments)
      .values({ name: sector.name })
      .returning();
    deptId = created.id;
    console.log(`  القطاع: تم الإنشاء`);
  }

  // Grades
  const existingGrades = await db
    .select()
    .from(professionalGrades)
    .where(eq(professionalGrades.departmentId, deptId));

  if (existingGrades.length > 0) {
    console.log(`  الدرجات: ${existingGrades.length} موجودة — تخطي`);
  } else {
    const inserted = await db
      .insert(professionalGrades)
      .values(sector.grades.map((name) => ({ name, departmentId: deptId })))
      .returning();
    console.log(`  الدرجات: تم إدراج ${inserted.length}`);
  }

  // Specialties
  const existingSpecialties = await db
    .select()
    .from(generalSpecialties)
    .where(eq(generalSpecialties.departmentId, deptId));

  if (existingSpecialties.length > 0) {
    console.log(`  التخصصات: ${existingSpecialties.length} موجودة — تخطي`);
  } else {
    const inserted = await db
      .insert(generalSpecialties)
      .values(sector.specialties.map((name) => ({ name, departmentId: deptId })))
      .returning();
    console.log(`  التخصصات: تم إدراج ${inserted.length}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== بدء seeding القطاعات الصحية ===");

  for (const sector of SECTORS) {
    await seedSector(sector);
  }

  console.log("\n=== اكتمل! ===");
  console.log("  GET /api/settings/departments/public");
  console.log("  GET /api/settings/professional-grades/public?departmentId=<id>");
  console.log("  GET /api/settings/general-specialties/public?departmentId=<id>");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
