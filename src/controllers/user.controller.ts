import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { AppError } from "../lib/errors.js";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await userService.list();
  res.json(users);
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await userService.create(req.body as CreateUserInput);
  res.status(201).json(user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await userService.update(
    req.params.id as string,
    req.body as UpdateUserInput
  );
  if (!user) throw new AppError(404, "User not found");
  res.json(user);
}
