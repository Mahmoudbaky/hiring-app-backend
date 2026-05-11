import type { Request, Response } from "express";
import { contactService } from "../services/contact.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateContactInput } from "../schemas/contact.schema.js";

export async function submit(req: Request, res: Response): Promise<void> {
  const message = await contactService.submit(req.body as CreateContactInput);
  sendCreated(res, message, "تم إرسال رسالتك بنجاح");
}

export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await contactService.list());
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const updated = await contactService.markRead(req.params.id as string);
  if (!updated) throw new NotFoundError("Message not found");
  sendSuccess(res, updated);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const deleted = await contactService.remove(req.params.id as string);
  if (!deleted) throw new NotFoundError("Message not found");
  sendSuccess(res, null, "تم حذف الرسالة بنجاح");
}
