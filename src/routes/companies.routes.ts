import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createCompanySchema, updateCompanySchema } from "../schemas/company.schema.js";
import * as companyController from "../controllers/company.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Hiring company management (super admin only)
 */

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: List all hiring companies
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", requireAuth, requireRole("super_admin"), companyController.list);

/**
 * @swagger
 * /api/companies/mine:
 *   get:
 *     summary: Get the company of the currently signed-in user
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/mine", requireAuth, companyController.getMyCompany);
router.patch("/mine", requireAuth, validate(updateCompanySchema), companyController.updateMine);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get a single company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", requireAuth, requireRole("super_admin"), companyController.getOne);

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a hiring company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, uniqueCode]
 *             properties:
 *               companyName: { type: string }
 *               uniqueCode: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               managerName: { type: string }
 *               companyRecord: { type: string }
 */
router.post(
  "/",
  requireAuth,
  requireRole("super_admin"),
  validate(createCompanySchema),
  companyController.create
);

/**
 * @swagger
 * /api/companies/{id}:
 *   patch:
 *     summary: Update a company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateCompanySchema),
  companyController.update
);

export default router;
