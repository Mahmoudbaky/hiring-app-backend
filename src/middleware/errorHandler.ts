import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
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
      .json(buildErrorBody("Validation failed", formatZodErrors(err)));
    return;
  }

  if (err instanceof ValidationError) {
    res.status(422).json(buildErrorBody(err.message, err.errors));
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
  res.status(404).json(buildErrorBody("Route not found"));
}
