import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createRequestSchema,
  createManualRequestSchema,
  updateRequestStatusSchema,
} from "../schemas/request.schema.js";
import * as requestController from "../controllers/request.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Job application / hiring request management
 */

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Public — applicant self-applies using a company's unique code
 *     tags: [Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobAdId, hiringCompanyCode, applicant]
 *             properties:
 *               jobAdId: { type: string, format: uuid }
 *               hiringCompanyCode: { type: string }
 *               cvUrl: { type: string }
 *               applicant:
 *                 type: object
 *                 required: [name, email, phone]
 *               qualifications: { type: array }
 */
router.post("/", validate(createRequestSchema), requestController.submit);

/**
 * @swagger
 * /api/requests/manual:
 *   post:
 *     summary: Company user manually submits on behalf of an applicant
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/manual",
  requireAuth,
  requireRole("super_admin", "company_user"),
  validate(createManualRequestSchema),
  requestController.submitManual
);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: List requests (super_admin all; company_user their company only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 */
router.get("/", requireAuth, requestController.list);
router.get("/:id", requireAuth, requestController.getById);

/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Update request status (super admin only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [new, review, shortlisted, interview, rejected, hired] }
 *               notes: { type: string }
 */
router.patch(
  "/:id/status",
  requireAuth,
  validate(updateRequestStatusSchema),
  requestController.updateStatus
);

export default router;
