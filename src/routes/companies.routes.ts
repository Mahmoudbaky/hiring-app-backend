import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { hiringCompanies } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

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
 *     responses:
 *       200:
 *         description: Array of companies
 */
router.get("/", requireAuth, requireRole("super_admin"), async (_req, res) => {
  const companies = await db
    .select()
    .from(hiringCompanies)
    .orderBy(hiringCompanies.createdAt);
  res.json(companies);
});

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Get a single company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const [company] = await db
      .select()
      .from(hiringCompanies)
      .where(eq(hiringCompanies.id, req.params.id as string));

    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  }
);

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
  async (req, res) => {
    const {
      companyName,
      uniqueCode,
      phoneNumber,
      address,
      managerName,
      companyRecord,
    } = req.body;

    const [company] = await db
      .insert(hiringCompanies)
      .values({ companyName, uniqueCode, phoneNumber, address, managerName, companyRecord })
      .returning();

    res.status(201).json(company);
  }
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
  async (req, res) => {
    const { companyName, phoneNumber, address, managerName, companyRecord, isActive } =
      req.body;

    const [company] = await db
      .update(hiringCompanies)
      .set({ companyName, phoneNumber, address, managerName, companyRecord, isActive, updatedAt: new Date() })
      .where(eq(hiringCompanies.id, req.params.id as string))
      .returning();

    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  }
);

export default router;
