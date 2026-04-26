import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Pass ZodError to the global errorHandler which formats it consistently
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
