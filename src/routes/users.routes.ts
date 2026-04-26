import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { auth } from "../lib/auth.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (super admin only)
 */

const userFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  hiringCompanyId: users.hiringCompanyId,
  createdAt: users.createdAt,
} as const;

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", requireAuth, requireRole("super_admin"), async (_req, res) => {
  const allUsers = await db
    .select(userFields)
    .from(users)
    .orderBy(users.createdAt);
  res.json(allUsers);
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a company user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, hiringCompanyId]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               hiringCompanyId: { type: string }
 */
router.post(
  "/",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { name, email, password, hiringCompanyId } = req.body;

    // Create user via better-auth (handles hashing, account linking, etc.)
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
    });

    // Assign role and company — better-auth doesn't expose these via signUp
    const [created] = await db
      .update(users)
      .set({ role: "company_user", hiringCompanyId: hiringCompanyId ?? null, updatedAt: new Date() })
      .where(eq(users.id, result.user.id))
      .returning(userFields);

    res.status(201).json(created);
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user's name or company assignment
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  async (req, res) => {
    const { name, hiringCompanyId } = req.body;

    const [updated] = await db
      .update(users)
      .set({ name, hiringCompanyId, updatedAt: new Date() })
      .where(eq(users.id, req.params.id as string))
      .returning(userFields);

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  }
);

export default router;
