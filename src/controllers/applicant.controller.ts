import type { Request, Response } from "express";
import { applicantService } from "../services/applicant.service.js";
import { AppError } from "../lib/errors.js";

export async function list(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const applicants = await applicantService.list(
    user.role,
    user.hiringCompanyId,
    req.query.companyId as string | undefined
  );
  res.json(applicants);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const result = await applicantService.getById(
    req.params.id as string,
    user.role,
    user.hiringCompanyId
  );
  if (!result) throw new AppError(404, "Applicant not found");
  if (result === "forbidden") throw new AppError(403, "Forbidden");
  res.json(result);
}
