import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createJobSchema, updateJobSchema } from "../schemas/job.schema.js";
import * as jobController from "../controllers/job.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job advertisement management
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List job ads (super_admin sees all; company_user sees published only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", requireAuth, jobController.list);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a single job ad
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", requireAuth, jobController.getOne);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a job ad (super admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [adTitle, adType]
 *             properties:
 *               adTitle: { type: string }
 *               jobTitleId: { type: string, format: uuid }
 *               adType: { type: string, enum: [remote, on_site, hybrid] }
 *               salaryFrom: { type: integer }
 *               salaryTo: { type: integer }
 *               description: { type: string }
 *               isPublished: { type: boolean }
 *               deadline: { type: string }
 */
router.post(
  "/",
  requireAuth,
  requireRole("super_admin"),
  validate(createJobSchema),
  jobController.create
);

/**
 * @swagger
 * /api/jobs/{id}:
 *   patch:
 *     summary: Update a job ad (super admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateJobSchema),
  jobController.update
);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job ad (super admin only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", requireAuth, requireRole("super_admin"), jobController.remove);

export default router;
