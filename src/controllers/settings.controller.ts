import type { Request, Response } from "express";
import { settingsService } from "../services/settings.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type {
  CreateJobTitleInput,
  UpdateJobTitleInput,
  CreateQualificationTypeInput,
  UpdateQualificationTypeInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateProfessionalGradeInput,
  UpdateProfessionalGradeInput,
  CreateGeneralSpecialtyInput,
  UpdateGeneralSpecialtyInput,
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

// ── Departments ───────────────────────────────────────────────────────────────

export async function listDepartments(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listDepartments());
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  sendCreated(res, await settingsService.createDepartment(req.body as CreateDepartmentInput));
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  const dept = await settingsService.updateDepartment(req.params.id as string, req.body as UpdateDepartmentInput);
  if (!dept) throw new NotFoundError("Department not found");
  sendSuccess(res, dept);
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  await settingsService.deleteDepartment(req.params.id as string);
  sendSuccess(res, null, "Deleted successfully");
}

// ── Professional Grades ───────────────────────────────────────────────────────

/** Public endpoint — active only */
export async function listProfessionalGrades(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listProfessionalGrades(req.query.departmentId as string | undefined, true));
}

/** Admin endpoint — all items including inactive */
export async function listAllProfessionalGrades(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listProfessionalGrades(req.query.departmentId as string | undefined, false));
}

export async function createProfessionalGrade(req: Request, res: Response): Promise<void> {
  sendCreated(res, await settingsService.createProfessionalGrade(req.body as CreateProfessionalGradeInput));
}

export async function updateProfessionalGrade(req: Request, res: Response): Promise<void> {
  const grade = await settingsService.updateProfessionalGrade(req.params.id as string, req.body as UpdateProfessionalGradeInput);
  if (!grade) throw new NotFoundError("Professional grade not found");
  sendSuccess(res, grade);
}

export async function deleteProfessionalGrade(req: Request, res: Response): Promise<void> {
  await settingsService.deleteProfessionalGrade(req.params.id as string);
  sendSuccess(res, null, "Deleted successfully");
}

// ── General Specialties ───────────────────────────────────────────────────────

/** Public endpoint — active only */
export async function listGeneralSpecialties(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listGeneralSpecialties(req.query.departmentId as string | undefined, true));
}

/** Admin endpoint — all items including inactive */
export async function listAllGeneralSpecialties(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.listGeneralSpecialties(req.query.departmentId as string | undefined, false));
}

export async function createGeneralSpecialty(req: Request, res: Response): Promise<void> {
  sendCreated(res, await settingsService.createGeneralSpecialty(req.body as CreateGeneralSpecialtyInput));
}

export async function updateGeneralSpecialty(req: Request, res: Response): Promise<void> {
  const specialty = await settingsService.updateGeneralSpecialty(req.params.id as string, req.body as UpdateGeneralSpecialtyInput);
  if (!specialty) throw new NotFoundError("General specialty not found");
  sendSuccess(res, specialty);
}

export async function deleteGeneralSpecialty(req: Request, res: Response): Promise<void> {
  await settingsService.deleteGeneralSpecialty(req.params.id as string);
  sendSuccess(res, null, "Deleted successfully");
}
