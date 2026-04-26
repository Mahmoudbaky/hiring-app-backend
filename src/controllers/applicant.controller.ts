import type { Request, Response } from "express";
import { applicantService } from "../services/applicant.service.js";
import { NotFoundError, ForbiddenError } from "../utils/index.js";
import { sendSuccess } from "../utils/response.js";

export async function list(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  sendSuccess(
    res,
    await applicantService.list(
      user.role,
      user.hiringCompanyId,
      req.query.companyId as string | undefined
    )
  );
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const result = await applicantService.getById(
    req.params.id as string,
    user.role,
    user.hiringCompanyId
  );
  if (!result) throw new NotFoundError("Applicant not found");
  if (result === "forbidden") throw new ForbiddenError();
  sendSuccess(res, result);
}
