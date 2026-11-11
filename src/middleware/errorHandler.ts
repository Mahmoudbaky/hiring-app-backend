import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { APIError } from "better-auth/api";
import { AppError, ValidationError } from "../utils/index.js";
import { buildErrorBody } from "../utils/response.js";
import logger from "../lib/logger.js";

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((acc, issue) => {
    const key = issue.path.length ? issue.path.join(".") : "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(issue.message);
    return acc;
  }, {});
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res
      .status(422)
      .json(buildErrorBody("البيانات المدخلة غير صالحة", formatZodErrors(err)));
    return;
  }

  if (err instanceof ValidationError) {
    res.status(422).json(buildErrorBody(err.message, err.errors));
    return;
  }

  // better-auth errors thrown from server-side auth.api.* calls
  if (err instanceof APIError) {
    const status = typeof err.statusCode === "number" ? err.statusCode : 400;
    const body = err.body as { message?: string; code?: string } | undefined;
    const message =
      body?.code === "USER_ALREADY_EXISTS" || body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
        ? "البريد الإلكتروني مستخدم بالفعل"
        : body?.code === "PASSWORD_TOO_SHORT"
          ? "كلمة المرور قصيرة جداً"
          : body?.code === "PASSWORD_TOO_LONG"
            ? "كلمة المرور طويلة جداً"
            : body?.code === "INVALID_PASSWORD"
              ? "كلمة المرور الحالية غير صحيحة"
              : (body?.message ?? err.message);
    res.status(status >= 400 && status < 600 ? status : 400).json(buildErrorBody(message));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(buildErrorBody(err.message));
    return;
  }

  logger.error(err.message, { stack: err.stack });
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;
  res.status(500).json(buildErrorBody(message));
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(buildErrorBody("المسار غير موجود"));
}
