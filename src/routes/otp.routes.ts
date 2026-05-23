import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import * as otpController from "../controllers/otp.controller.js";

const router: Router = Router();

const sendSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({ email: z.string().email(), otp: z.string().length(6) });

router.post("/send", validate(sendSchema), otpController.send);
router.post("/verify", validate(verifySchema), otpController.verify);

export default router;
