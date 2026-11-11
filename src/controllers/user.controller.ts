import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { BadRequestError, NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

export async function list(req: Request, res: Response): Promise<void> {
  // Super admin sees every company user across both portals; a company user
  // sees only their own company's users.
  if (req.user?.role === "super_admin") {
    sendSuccess(res, await userService.listAll());
    return;
  }
  sendSuccess(res, await userService.list(req.user?.hiringCompanyId));
}

export async function create(req: Request, res: Response): Promise<void> {
  const { hiringCompanyId, clientCompanyId, ...body } = req.body as CreateUserInput;

  let companyType: "hiring" | "client";
  let companyId: string | undefined;
  if (req.user?.role === "super_admin") {
    if (!!hiringCompanyId === !!clientCompanyId) {
      throw new BadRequestError("يرجى تحديد شركة توظيف أو شركة عميلة واحدة");
    }
    companyType = hiringCompanyId ? "hiring" : "client";
    companyId = hiringCompanyId ?? clientCompanyId;
  } else {
    // company_user can only create users for their own company
    companyType = "hiring";
    companyId = req.user?.hiringCompanyId ?? undefined;
  }
  if (!companyId) throw new BadRequestError("يرجى تحديد الشركة");

  sendCreated(res, await userService.create({ ...body, companyType, companyId }));
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
