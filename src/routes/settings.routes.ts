import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createJobTitleSchema,
  updateJobTitleSchema,
  createQualificationTypeSchema,
  updateQualificationTypeSchema,
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

export default router;
