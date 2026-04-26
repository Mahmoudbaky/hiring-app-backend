import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type {
  CreateJobTitleInput,
  UpdateJobTitleInput,
  CreateQualificationTypeInput,
  UpdateQualificationTypeInput,
} from "../schemas/settings.schema.js";

// ── Job Titles ────────────────────────────────────────────────────────────────

export async function listJobTitles(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listJobTitles());
}

export async function createJobTitle(req: Request, res: Response): Promise<void> {
  sendCreated(res, await settingsService.createJobTitle(req.body as CreateJobTitleInput));
}

export async function updateJobTitle(req: Request, res: Response): Promise<void> {
  const title = await settingsService.updateJobTitle(
    req.params.id as string,
    req.body as UpdateJobTitleInput
  );
  if (!title) throw new NotFoundError("Job title not found");
  sendSuccess(res, title);
}

export async function deleteJobTitle(req: Request, res: Response): Promise<void> {
  await settingsService.deleteJobTitle(req.params.id as string);
  sendSuccess(res, null, "Deleted successfully");
}

// ── Qualification Types ───────────────────────────────────────────────────────

export async function listQualificationTypes(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listQualificationTypes());
}

export async function createQualificationType(req: Request, res: Response): Promise<void> {
  sendCreated(
    res,
    await settingsService.createQualificationType(req.body as CreateQualificationTypeInput)
  );
}

export async function updateQualificationType(req: Request, res: Response): Promise<void> {
  const type = await settingsService.updateQualificationType(
    req.params.id as string,
    req.body as UpdateQualificationTypeInput
  );
  if (!type) throw new NotFoundError("Qualification type not found");
  sendSuccess(res, type);
}

export async function deleteQualificationType(req: Request, res: Response): Promise<void> {
  await settingsService.deleteQualificationType(req.params.id as string);
  sendSuccess(res, null, "Deleted successfully");
}
