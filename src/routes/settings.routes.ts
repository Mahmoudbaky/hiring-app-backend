import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createJobTitleSchema,
  updateJobTitleSchema,
  createQualificationTypeSchema,
  updateQualificationTypeSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createProfessionalGradeSchema,
  updateProfessionalGradeSchema,
  createGeneralSpecialtySchema,
  updateGeneralSpecialtySchema,
} from "../schemas/settings.schema.js";
import * as settingsController from "../controllers/settings.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: App settings managed by super admin
 */

// ── Job Titles ────────────────────────────────────────────────────────────────

router.get("/job-titles", requireAuth, settingsController.listJobTitles);
router.post(
  "/job-titles",
  requireAuth,
  requireRole("super_admin"),
  validate(createJobTitleSchema),
  settingsController.createJobTitle
);
router.patch(
  "/job-titles/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateJobTitleSchema),
  settingsController.updateJobTitle
);
router.delete(
  "/job-titles/:id",
  requireAuth,
  requireRole("super_admin"),
  settingsController.deleteJobTitle
);

// ── Qualification Types ───────────────────────────────────────────────────────

/** Public — used by the self-apply form (no auth required) */
router.get("/qualification-types/public", settingsController.listQualificationTypes);
router.get("/qualification-types", requireAuth, settingsController.listQualificationTypes);
router.post(
  "/qualification-types",
  requireAuth,
  requireRole("super_admin"),
  validate(createQualificationTypeSchema),
  settingsController.createQualificationType
);
router.patch(
  "/qualification-types/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateQualificationTypeSchema),
  settingsController.updateQualificationType
);
router.delete(
  "/qualification-types/:id",
  requireAuth,
  requireRole("super_admin"),
  settingsController.deleteQualificationType
);

// ── Departments ───────────────────────────────────────────────────────────────

/** Public — used by the self-apply form */
router.get("/departments/public", settingsController.listDepartments);
router.get("/departments", requireAuth, settingsController.listDepartments);
router.post(
  "/departments",
  requireAuth,
  requireRole("super_admin"),
  validate(createDepartmentSchema),
  settingsController.createDepartment
);
router.patch(
  "/departments/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateDepartmentSchema),
  settingsController.updateDepartment
);
router.delete(
  "/departments/:id",
  requireAuth,
  requireRole("super_admin"),
  settingsController.deleteDepartment
);

// ── Professional Grades ───────────────────────────────────────────────────────

/** Public — filtered by ?departmentId=uuid */
router.get("/professional-grades/public", settingsController.listProfessionalGrades);
router.get("/professional-grades", requireAuth, settingsController.listProfessionalGrades);
router.post(
  "/professional-grades",
  requireAuth,
  requireRole("super_admin"),
  validate(createProfessionalGradeSchema),
  settingsController.createProfessionalGrade
);
router.patch(
  "/professional-grades/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateProfessionalGradeSchema),
  settingsController.updateProfessionalGrade
);
router.delete(
  "/professional-grades/:id",
  requireAuth,
  requireRole("super_admin"),
  settingsController.deleteProfessionalGrade
);

// ── General Specialties ───────────────────────────────────────────────────────

/** Public — filtered by ?departmentId=uuid */
router.get("/general-specialties/public", settingsController.listGeneralSpecialties);
router.get("/general-specialties", requireAuth, settingsController.listGeneralSpecialties);
router.post(
  "/general-specialties",
  requireAuth,
  requireRole("super_admin"),
  validate(createGeneralSpecialtySchema),
  settingsController.createGeneralSpecialty
);
router.patch(
  "/general-specialties/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateGeneralSpecialtySchema),
  settingsController.updateGeneralSpecialty
);
router.delete(
  "/general-specialties/:id",
  requireAuth,
  requireRole("super_admin"),
  settingsController.deleteGeneralSpecialty
);

export default router;
