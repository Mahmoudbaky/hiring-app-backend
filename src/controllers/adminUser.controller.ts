import type { Request, Response } from "express";
import { adminUserService } from "../services/adminUser.service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateAdminInput, UpdateAdminInput } from "../schemas/adminUser.schema.js";

export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await adminUserService.list());
}

export async function create(req: Request, res: Response): Promise<void> {
  const admin = await adminUserService.create(req.body as CreateAdminInput);
  sendCreated(res, admin, "تم إنشاء حساب المشرف بنجاح");
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  // A super admin cannot freeze or rename their own account here.
  if (id === req.user?.id) throw new BadRequestError("لا يمكنك تعديل حسابك من هذه الصفحة");
  const admin = await adminUserService.update(id, req.body as UpdateAdminInput);
  if (!admin) throw new NotFoundError("المشرف غير موجود");
  sendSuccess(res, admin);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  if (id === req.user?.id) throw new BadRequestError("لا يمكنك حذف حسابك");
  const deleted = await adminUserService.remove(id);
  if (!deleted) throw new NotFoundError("المشرف غير موجود");
  sendSuccess(res, null, "تم حذف المشرف بنجاح");
}
