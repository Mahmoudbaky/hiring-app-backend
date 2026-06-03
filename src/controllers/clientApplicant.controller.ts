import type { Request, Response } from "express";
import { z } from "zod";
import { clientApplicantService } from "../services/clientApplicant.service.js";
import { sendSuccess } from "../utils/response.js";
import { BadRequestError, ForbiddenError } from "../utils/errors.js";

const statusSchema = z.object({
  status: z.enum(["new", "review", "shortlisted", "interview", "rejected", "hired"]),
});

export async function listApplicants(req: Request, res: Response) {
  const clientCompanyId = req.user?.clientCompanyId;
  if (!clientCompanyId) throw new ForbiddenError();

  const data = await clientApplicantService.list(clientCompanyId);
  sendSuccess(res, data);
}

export async function getApplicant(req: Request, res: Response) {
  const clientCompanyId = req.user?.clientCompanyId;
  if (!clientCompanyId) throw new ForbiddenError();

  const data = await clientApplicantService.getById(clientCompanyId, req.params.id as string);
  sendSuccess(res, data);
}

export async function updateStatus(req: Request, res: Response) {
  const clientCompanyId = req.user?.clientCompanyId;
  if (!clientCompanyId) throw new ForbiddenError();

  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) throw new BadRequestError("حالة غير صالحة");

  const data = await clientApplicantService.updateStatus(clientCompanyId, req.params.id as string, parsed.data.status);
  sendSuccess(res, data, "تم تحديث الحالة بنجاح");
}

export async function getMyCompany(req: Request, res: Response) {
  const clientCompanyId = req.user?.clientCompanyId;
  if (!clientCompanyId) throw new ForbiddenError();

  const data = await clientApplicantService.getMyCompany(clientCompanyId);
  sendSuccess(res, data);
}
