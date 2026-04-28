import type { Request, Response, NextFunction } from "express";
import { uploadCv } from "../services/upload.service.js";
import { sendSuccess } from "../utils/response.js";
import { BadRequestError } from "../utils/errors.js";

export async function uploadCvFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new BadRequestError("لم يتم إرفاق ملف");
    const url = await uploadCv(req.file.buffer, req.file.originalname);
    sendSuccess(res, { url }, "تم رفع الملف بنجاح");
  } catch (err) {
    next(err);
  }
}
