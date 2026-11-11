import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerCompanySchema } from "../schemas/company.schema.js";
import { register } from "../controllers/register.controller.js";
import { registerLimiter } from "../middleware/rateLimit.js";

const router: Router = Router();

/**
 * @swagger
 * tags:
 *   name: Register
 *   description: Public company self-registration
 */

/**
 * @swagger
 * /api/register-company:
 *   post:
 *     summary: Register a new hiring or client company with its first user
 *     description: The company starts unconfirmed; an OTP is emailed and must be verified via /api/otp/verify before the user can sign in.
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, name, email, password]
 *             properties:
 *               companyType: { type: string, enum: [hiring, client], default: hiring }
 *               companyName: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               managerName: { type: string }
 *               companyRecord: { type: string }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, maxLength: 128 }
 *               userPhoneNumber: { type: string }
 *     responses:
 *       201:
 *         description: Company and user created successfully
 *       409:
 *         description: Email already in use
 */
router.post("/", registerLimiter, validate(registerCompanySchema), register);

export default router;
