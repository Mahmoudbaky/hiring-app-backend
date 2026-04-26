import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UnauthorizedError, ForbiddenError } from "../utils/index.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "company_user";
  hiringCompanyId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) throw new UnauthorizedError();

  const u = session.user as typeof session.user & {
    role?: string;
    hiringCompanyId?: string;
  };

  req.user = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as AuthUser["role"]) ?? "company_user",
    hiringCompanyId: u.hiringCompanyId ?? null,
  };

  next();
}

export function requireRole(...roles: Array<"super_admin" | "company_user">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
