import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth.js";
import { db } from "../db/index.js";
import { hiringCompanies, clientCompanies } from "../db/schema.js";
import { UnauthorizedError, ForbiddenError } from "../utils/index.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "company_user" | "client_company_user";
  hiringCompanyId: string | null;
  clientCompanyId: string | null;
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
    clientCompanyId?: string;
    isFrozen?: boolean;
  };

  if (u.isFrozen) throw new UnauthorizedError("تم تجميد حسابك");

  const role = (u.role as AuthUser["role"]) ?? "company_user";
  const hiringCompanyId = u.hiringCompanyId ?? null;
  const clientCompanyId = u.clientCompanyId ?? null;

  if (role === "company_user" && hiringCompanyId) {
    const [company] = await db
      .select({ isActive: hiringCompanies.isActive, isConfirmed: hiringCompanies.isConfirmed })
      .from(hiringCompanies)
      .where(eq(hiringCompanies.id, hiringCompanyId));
    if (company && !company.isConfirmed) {
      throw new ForbiddenError("لم يتم تأكيد بريد الشركة بعد، يرجى التحقق من بريدك الإلكتروني");
    }
    if (company && !company.isActive) {
      throw new ForbiddenError("تم تجميد شركتك، يرجى التواصل مع المسؤول");
    }
  }

  if (role === "client_company_user" && clientCompanyId) {
    const [company] = await db
      .select({ isActive: clientCompanies.isActive, isConfirmed: clientCompanies.isConfirmed })
      .from(clientCompanies)
      .where(eq(clientCompanies.id, clientCompanyId));
    if (company && !company.isConfirmed) {
      throw new ForbiddenError("لم يتم تأكيد بريد الشركة بعد، يرجى التحقق من بريدك الإلكتروني");
    }
    if (company && !company.isActive) {
      throw new ForbiddenError("تم تجميد شركتك، يرجى التواصل مع المسؤول");
    }
  }

  req.user = {
    id: u.id,
    name: u.name,
    email: u.email,
    role,
    hiringCompanyId,
    clientCompanyId,
  };

  next();
}

export function requireRole(...roles: Array<"super_admin" | "company_user" | "client_company_user">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
