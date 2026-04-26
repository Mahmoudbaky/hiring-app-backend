import type { Request, Response } from "express";
import { companyService } from "../services/company.service.js";
import { AppError } from "../lib/errors.js";
import type { CreateCompanyInput, UpdateCompanyInput } from "../schemas/company.schema.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const companies = await companyService.list();
  res.json(companies);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const company = await companyService.getById(req.params.id as string);
  if (!company) throw new AppError(404, "Company not found");
  res.json(company);
}

export async function create(req: Request, res: Response): Promise<void> {
  const company = await companyService.create(req.body as CreateCompanyInput);
  res.status(201).json(company);
}

export async function update(req: Request, res: Response): Promise<void> {
  const company = await companyService.update(
    req.params.id as string,
    req.body as UpdateCompanyInput
  );
  if (!company) throw new AppError(404, "Company not found");
  res.json(company);
}
