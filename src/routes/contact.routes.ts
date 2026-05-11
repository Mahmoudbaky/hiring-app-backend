import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createContactSchema } from "../schemas/contact.schema.js";
import * as contactController from "../controllers/contact.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submissions
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message (public)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, subject, message]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               subject: { type: string }
 *               message: { type: string }
 */
router.post("/", validate(createContactSchema), contactController.submit);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: List all contact messages (super admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  requireAuth,
  requireRole("super_admin"),
  contactController.list
);

/**
 * @swagger
 * /api/contact/{id}/read:
 *   patch:
 *     summary: Mark a message as read (super admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/read",
  requireAuth,
  requireRole("super_admin"),
  contactController.markRead
);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message (super admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  contactController.remove
);

export default router;
