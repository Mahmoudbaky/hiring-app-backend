import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import * as applicantController from "../controllers/applicant.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Applicants
 *   description: Applicant listing
 */

/**
 * @swagger
 * /api/applicants:
 *   get:
 *     summary: List applicants (super_admin all + ?companyId filter; company_user their company)
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema: { type: string }
 */
router.get("/", requireAuth, applicantController.list);

/**
 * @swagger
 * /api/applicants/{id}:
 *   get:
 *     summary: Get a single applicant with academic qualifications
 *     tags: [Applicants]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", requireAuth, applicantController.getOne);

export default router;
