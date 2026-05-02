import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerCompanySchema } from "../schemas/company.schema.js";
import { register } from "../controllers/register.controller.js";

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
 *     summary: Register a new hiring company with its first admin user
 *     tags: [Register]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyName, uniqueCode, name, email, password]
 *             properties:
 *               companyName: { type: string }
 *               uniqueCode: { type: string }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               managerName: { type: string }
 *               companyRecord: { type: string }
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Company and user created successfully
 *       409:
 *         description: Email or uniqueCode already in use
 */
router.post("/", validate(registerCompanySchema), register);

export default router;
