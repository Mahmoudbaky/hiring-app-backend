import type { Request, Response } from "express";
import { requestService } from "../services/request.service.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type {
  CreateRequestInput,
  CreateManualRequestInput,
  UpdateRequestStatusInput,
} from "../schemas/request.schema.js";

export async function submit(req: Request, res: Response): Promise<void> {
  sendCreated(res, await requestService.submit(req.body as CreateRequestInput));
}

export async function submitManual(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const data = req.body as CreateManualRequestInput;

  let companyId: string;
  if (user.role === "super_admin") {
    if (!data.companyId) throw new BadRequestError("companyId is required for super_admin");
    companyId = data.companyId;
  } else {
    if (!user.hiringCompanyId) throw new ForbiddenError("User is not associated with a company");
    companyId = user.hiringCompanyId;
  }

  sendCreated(res, await requestService.submitManual(data, user.id, companyId));
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  sendSuccess(
    res,
    await requestService.list(
      user.role,
      user.hiringCompanyId,
      req.query.companyId as string | undefined
    )
  );
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  sendSuccess(
    res,
    await requestService.getById(
      req.params.id as string,
      user.role,
      user.hiringCompanyId ?? null
    )
  );
}

export async function markViewed(req: Request, res: Response): Promise<void> {
  const updated = await requestService.markViewedByAdmin(req.params.id as string);
  if (!updated) throw new NotFoundError("Request not found");
  sendSuccess(res, updated);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const updated = await requestService.updateStatus(
    req.params.id as string,
    req.body as UpdateRequestStatusInput,
    user.role,
    user.hiringCompanyId ?? null
  );
  if (!updated) throw new NotFoundError("Request not found");
  sendSuccess(res, updated);
}
