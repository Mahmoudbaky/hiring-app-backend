import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { jobAds } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

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
router.get("/", requireAuth, async (req, res) => {
  const isSuperAdmin = req.user!.role === "super_admin";

  const jobs = isSuperAdmin
    ? await db.select().from(jobAds).orderBy(desc(jobAds.createdAt))
    : await db
        .select()
        .from(jobAds)
        .where(eq(jobAds.isPublished, true))
        .orderBy(desc(jobAds.createdAt));

  res.json(jobs);
});

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a single job ad
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", requireAuth, async (req, res) => {
  const [job] = await db
    .select()
    .from(jobAds)
    .where(eq(jobAds.id, req.params.id as string));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (req.user!.role !== "super_admin" && !job.isPublished) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

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
 *               jobTitleId: { type: string }
 *               adType:
 *                 type: string
 *                 enum: [remote, on_site, hybrid]
 *               salaryFrom: { type: integer }
 *               salaryTo: { type: integer }
 *               description: { type: string }
 *               isPublished: { type: boolean }
 *               deadline: { type: string, format: date-time }
 */
router.post("/", requireAuth, requireRole("super_admin"), async (req, res) => {
    const {
    adTitle,
    jobTitleId,
    adType,
    salaryFrom,
    salaryTo,
    description,
    isPublished,
    deadline,
  } = req.body;

  const [job] = await db
    .insert(jobAds)
    .values({
      adTitle,
      jobTitleId,
      adType,
      salaryFrom,
      salaryTo,
      description,
      isPublished: isPublished ?? false,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user!.id,
    })
    .returning();

  res.status(201).json(job);
});

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
  async (req, res) => {
    const {
      adTitle,
      jobTitleId,
      adType,
      salaryFrom,
      salaryTo,
      description,
      isPublished,
      deadline,
    } = req.body;

    const [job] = await db
      .update(jobAds)
      .set({
        adTitle,
        jobTitleId,
        adType,
        salaryFrom,
        salaryTo,
        description,
        isPublished,
        deadline: deadline !== undefined ? new Date(deadline) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(jobAds.id, req.params.id as string))
      .returning();

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json(job);
  }
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
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const [deleted] = await db
      .delete(jobAds)
      .where(eq(jobAds.id, req.params.id as string))
      .returning({ id: jobAds.id });

    if (!deleted) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.json({ success: true });
  }
);

export default router;
