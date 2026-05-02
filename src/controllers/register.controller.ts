import type { Request, Response } from "express";
import { registerCompany } from "../services/register.service.js";
import { sendCreated } from "../utils/response.js";

export async function register(req: Request, res: Response) {
  const result = await registerCompany(req.body);
  sendCreated(res, result, "تم إنشاء الشركة والحساب بنجاح");
}
