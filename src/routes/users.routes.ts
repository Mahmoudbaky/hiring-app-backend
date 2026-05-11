import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import * as userController from "../controllers/user.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (super admin only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", requireAuth, userController.list);

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
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *               hiringCompanyId: { type: string, format: uuid }
 */
router.post(
  "/",
  requireAuth,
  validate(createUserSchema),
  userController.create
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
  validate(updateUserSchema),
  userController.update
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  userController.remove
);

export default router;
