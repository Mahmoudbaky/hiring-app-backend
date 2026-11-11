import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { otpLimiter } from "../middleware/rateLimit.js";
import * as otpController from "../controllers/otp.controller.js";

const router: Router = Router();

const email = z.string().trim().toLowerCase().email();
const sendSchema = z.object({ email });
const verifySchema = z.object({ email, otp: z.string().regex(/^\d{6}$/) });

router.use(otpLimiter);
router.post("/send", validate(sendSchema), otpController.send);
router.post("/verify", validate(verifySchema), otpController.verify);

export default router;
