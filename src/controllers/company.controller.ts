import type { Request, Response } from "express";
import { companyService } from "../services/company.service.js";
import { NotFoundError, BadRequestError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateCompanyInput, UpdateCompanyInput } from "../schemas/company.schema.js";

export async function getMyCompany(req: Request, res: Response): Promise<void> {
  const companyId = req.user?.hiringCompanyId;
  if (!companyId) throw new BadRequestError("No company associated with this account");
  const company = await companyService.getById(companyId);
  if (!company) throw new NotFoundError("Company not found");
  sendSuccess(res, company);
}

export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await companyService.list());
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const company = await companyService.getById(req.params.id as string);
  if (!company) throw new NotFoundError("Company not found");
  sendSuccess(res, company);
}

export async function create(req: Request, res: Response): Promise<void> {
  sendCreated(res, await companyService.create(req.body as CreateCompanyInput));
}

export async function update(req: Request, res: Response): Promise<void> {
  const company = await companyService.update(
    req.params.id as string,
    req.body as UpdateCompanyInput
  );
  if (!company) throw new NotFoundError("Company not found");
  sendSuccess(res, company);
}
