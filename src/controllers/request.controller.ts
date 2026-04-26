import type { Request, Response } from "express";
import { requestService } from "../services/request.service.js";
import { AppError } from "../lib/errors.js";
import type {
  CreateRequestInput,
  CreateManualRequestInput,
  UpdateRequestStatusInput,
} from "../schemas/request.schema.js";

export async function submit(req: Request, res: Response): Promise<void> {
  const request = await requestService.submit(req.body as CreateRequestInput);
  res.status(201).json(request);
}

export async function submitManual(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  if (!user.hiringCompanyId) throw new AppError(403, "User is not associated with a company");
  const request = await requestService.submitManual(
    req.body as CreateManualRequestInput,
    user.id,
    user.hiringCompanyId
  );
  res.status(201).json(request);
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const requests = await requestService.list(
    user.role,
    user.hiringCompanyId,
    req.query.companyId as string | undefined
  );
  res.json(requests);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const updated = await requestService.updateStatus(
    req.params.id as string,
    req.body as UpdateRequestStatusInput
  );
  if (!updated) throw new AppError(404, "Request not found");
  res.json(updated);
}
