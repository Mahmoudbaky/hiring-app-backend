import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { jobTitleSettings, qualificationTypeSettings } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: App settings managed by super admin
 */

// ── Job Titles ────────────────────────────────────────────────────────────────

router.get("/job-titles", requireAuth, async (_req, res) => {
  const titles = await db
    .select()
    .from(jobTitleSettings)
    .where(eq(jobTitleSettings.isActive, true));
  res.json(titles);
});

router.post(
  "/job-titles",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { title } = req.body;
    const [created] = await db
      .insert(jobTitleSettings)
      .values({ title })
      .returning();
    res.status(201).json(created);
  }
);

router.patch(
  "/job-titles/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { title, isActive } = req.body;
    const [updated] = await db
      .update(jobTitleSettings)
      .set({ title, isActive })
      .where(eq(jobTitleSettings.id, req.params.id as string))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  }
);

router.delete(
  "/job-titles/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    await db
      .update(jobTitleSettings)
      .set({ isActive: false })
      .where(eq(jobTitleSettings.id, req.params.id as string));
    res.json({ success: true });
  }
);

// ── Qualification Types ───────────────────────────────────────────────────────

router.get("/qualification-types", requireAuth, async (_req, res) => {
  const types = await db
    .select()
    .from(qualificationTypeSettings)
    .where(eq(qualificationTypeSettings.isActive, true));
  res.json(types);
});

router.post(
  "/qualification-types",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { name } = req.body;
    const [created] = await db
      .insert(qualificationTypeSettings)
      .values({ name })
      .returning();
    res.status(201).json(created);
  }
);

router.patch(
  "/qualification-types/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { name, isActive } = req.body;
    const [updated] = await db
      .update(qualificationTypeSettings)
      .set({ name, isActive })
      .where(eq(qualificationTypeSettings.id, req.params.id as string))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  }
);

router.delete(
  "/qualification-types/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    await db
      .update(qualificationTypeSettings)
      .set({ isActive: false })
      .where(eq(qualificationTypeSettings.id, req.params.id as string));
    res.json({ success: true });
  }
);

export default router;
