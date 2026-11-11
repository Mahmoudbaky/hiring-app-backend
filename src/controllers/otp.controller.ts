import type { Request, Response } from "express";
import { sendOtp, verifyOtp } from "../services/otp.service.js";
import { sendSuccess } from "../utils/response.js";

export async function send(req: Request, res: Response): Promise<void> {
  await sendOtp(req.body.email as string);
  // Same message whether or not the email is registered (no enumeration).
  sendSuccess(res, null, "إذا كان البريد مسجلاً وغير مؤكد، فقد تم إرسال رمز التحقق إليه");
}

export async function verify(req: Request, res: Response): Promise<void> {
  await verifyOtp(req.body.email as string, req.body.otp as string);
  sendSuccess(res, null, "تم تأكيد الشركة بنجاح، يمكنك تسجيل الدخول الآن");
}
