import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service.js";
import { AppError } from "../lib/errors.js";
import type {
  CreateJobTitleInput,
  UpdateJobTitleInput,
  CreateQualificationTypeInput,
  UpdateQualificationTypeInput,
} from "../schemas/settings.schema.js";

// ── Job Titles ────────────────────────────────────────────────────────────────

export async function listJobTitles(_req: Request, res: Response): Promise<void> {
  res.json(await settingsService.listJobTitles());
}

export async function createJobTitle(req: Request, res: Response): Promise<void> {
  const title = await settingsService.createJobTitle(req.body as CreateJobTitleInput);
  res.status(201).json(title);
}

export async function updateJobTitle(req: Request, res: Response): Promise<void> {
  const title = await settingsService.updateJobTitle(
    req.params.id as string,
    req.body as UpdateJobTitleInput
  );
  if (!title) throw new AppError(404, "Job title not found");
  res.json(title);
}

export async function deleteJobTitle(req: Request, res: Response): Promise<void> {
  await settingsService.deleteJobTitle(req.params.id as string);
  res.json({ success: true });
}

// ── Qualification Types ───────────────────────────────────────────────────────

export async function listQualificationTypes(_req: Request, res: Response): Promise<void> {
  res.json(await settingsService.listQualificationTypes());
}

export async function createQualificationType(req: Request, res: Response): Promise<void> {
  const type = await settingsService.createQualificationType(
    req.body as CreateQualificationTypeInput
  );
  res.status(201).json(type);
}

export async function updateQualificationType(req: Request, res: Response): Promise<void> {
  const type = await settingsService.updateQualificationType(
    req.params.id as string,
    req.body as UpdateQualificationTypeInput
  );
  if (!type) throw new AppError(404, "Qualification type not found");
  res.json(type);
}

export async function deleteQualificationType(req: Request, res: Response): Promise<void> {
  await settingsService.deleteQualificationType(req.params.id as string);
  res.json({ success: true });
}
