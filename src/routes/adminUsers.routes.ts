import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createAdminSchema, updateAdminSchema } from "../schemas/adminUser.schema.js";
import * as adminUserController from "../controllers/adminUser.controller.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: AdminUsers
 *   description: Super-admin account management (super admin only)
 */

router.get("/", requireAuth, requireRole("super_admin"), adminUserController.list);

router.post(
  "/",
  requireAuth,
  requireRole("super_admin"),
  validate(createAdminSchema),
  adminUserController.create
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(updateAdminSchema),
  adminUserController.update
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  adminUserController.remove
);

export default router;
