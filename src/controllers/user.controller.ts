import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { NotFoundError } from "../utils/index.js";
import { sendSuccess, sendCreated } from "../utils/response.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

export async function list(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await userService.list());
}

export async function create(req: Request, res: Response): Promise<void> {
  sendCreated(res, await userService.create(req.body as CreateUserInput));
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await userService.update(
    req.params.id as string,
    req.body as UpdateUserInput
  );
  if (!user) throw new NotFoundError("User not found");
  sendSuccess(res, user);
}
