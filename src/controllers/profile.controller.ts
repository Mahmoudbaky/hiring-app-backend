import type { Request, Response } from "express";
import { profileService } from "../services/profile.service.js";
import { NotFoundError } from "../utils/errors.js";
import { sendSuccess } from "../utils/response.js";
import type { UpdateProfileInput } from "../schemas/user.schema.js";

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await profileService.get(req.user!.id);
  if (!user) throw new NotFoundError("User not found");
  sendSuccess(res, user);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await profileService.update(req.user!.id, req.body as UpdateProfileInput);
  if (!user) throw new NotFoundError("User not found");
  sendSuccess(res, user, "تم تحديث الملف الشخصي بنجاح");
}
