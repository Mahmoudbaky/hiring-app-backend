import type { Request, Response, NextFunction } from "express";
import { uploadCv, uploadImage } from "../services/upload.service.js";
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

export async function uploadImageFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new BadRequestError("لم يتم إرفاق صورة");
    const url = await uploadImage(req.file.buffer, req.file.originalname);
    sendSuccess(res, { url }, "تم رفع الصورة بنجاح");
  } catch (err) {
    next(err);
  }
}

export async function proxyCv(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") throw new BadRequestError("url query param required");
    res.redirect(url);
  } catch (err) {
    next(err);
  }
}
