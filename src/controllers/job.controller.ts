import type { Request, Response } from "express";
import { jobService } from "../services/job.service.js";
import { AppError } from "../lib/errors.js";
import type { CreateJobInput, UpdateJobInput } from "../schemas/job.schema.js";

export async function list(req: Request, res: Response): Promise<void> {
  const jobs = await jobService.list(req.user!.role);
  res.json(jobs);
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const job = await jobService.getById(req.params.id as string, req.user!.role);
  if (!job) throw new AppError(404, "Job not found");
  res.json(job);
}

export async function create(req: Request, res: Response): Promise<void> {
  const job = await jobService.create(req.body as CreateJobInput, req.user!.id);
  res.status(201).json(job);
}

export async function update(req: Request, res: Response): Promise<void> {
  const job = await jobService.update(
    req.params.id as string,
    req.body as UpdateJobInput
  );
  if (!job) throw new AppError(404, "Job not found");
  res.json(job);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await jobService.remove(req.params.id as string);
  if (!deleted) throw new AppError(404, "Job not found");
  res.json({ success: true });
}
