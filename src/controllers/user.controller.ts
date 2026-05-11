import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

export async function list(req: Request, res: Response): Promise<void> {
  const companyId = req.user?.role === "super_admin" ? null : req.user?.hiringCompanyId;
  sendSuccess(res, await userService.list(companyId));
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateUserInput;
  // company_user can only create users for their own company
  if (req.user?.role !== "super_admin") {
    body.hiringCompanyId = req.user?.hiringCompanyId ?? undefined;
  }
  sendCreated(res, await userService.create(body));
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await userService.update(
    req.params.id as string,
    req.body as UpdateUserInput
  );
  if (!user) throw new NotFoundError("User not found");
  sendSuccess(res, user);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await userService.remove(req.params.id as string);
  if (!deleted) throw new NotFoundError("User not found");
  sendSuccess(res, null, "تم حذف المستخدم بنجاح");
}
