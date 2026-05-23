import type { Request, Response } from "express";
import { sendOtp, verifyOtp } from "../services/otp.service.js";
import { sendSuccess } from "../utils/response.js";

export async function send(req: Request, res: Response): Promise<void> {
  await sendOtp(req.body.email as string);
  sendSuccess(res, null, "تم إرسال رمز التحقق إلى بريدك الإلكتروني");
}

export async function verify(req: Request, res: Response): Promise<void> {
  await verifyOtp(req.body.email as string, req.body.otp as string);
  sendSuccess(res, null, "تم تأكيد الشركة بنجاح، يمكنك تسجيل الدخول الآن");
}
