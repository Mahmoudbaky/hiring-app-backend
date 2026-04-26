import type { Request, Response } from "express";
import { jobService } from "../services/job.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateJobInput, UpdateJobInput } from "../schemas/job.schema.js";

export async function list(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await jobService.list(req.user!.role));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const job = await jobService.getById(req.params.id as string, req.user!.role);
  if (!job) throw new NotFoundError("Job not found");
  sendSuccess(res, job);
}

export async function create(req: Request, res: Response): Promise<void> {
  sendCreated(res, await jobService.create(req.body as CreateJobInput, req.user!.id));
}

export async function update(req: Request, res: Response): Promise<void> {
  const job = await jobService.update(req.params.id as string, req.body as UpdateJobInput);
  if (!job) throw new NotFoundError("Job not found");
  sendSuccess(res, job);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await jobService.remove(req.params.id as string);
  if (!deleted) throw new NotFoundError("Job not found");
  sendSuccess(res, null, "Deleted successfully");
}

export async function listPublic(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await jobService.listPublic());
}
