import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../schemas/user.schema.js";
import * as profileController from "../controllers/profile.controller.js";

const router: Router = Router();

router.get("/me", requireAuth, profileController.getMe);
router.patch("/me", requireAuth, validate(updateProfileSchema), profileController.updateMe);

export default router;
