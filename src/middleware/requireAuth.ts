import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { adminAuth, hiringAuth, clientAuth } from "../lib/auth.js";
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
  const headers = fromNodeHeaders(req.headers);

  // Each portal reads only its own prefixed cookie, so at most one of these
  // returns a session. Order: admin → hiring → client.
  const [adminSession, hiringSession, clientSession] = await Promise.all([
    adminAuth.api.getSession({ headers }),
    hiringAuth.api.getSession({ headers }),
    clientAuth.api.getSession({ headers }),
  ]);

  // ── Super admin ──────────────────────────────
  if (adminSession) {
    const u = adminSession.user as typeof adminSession.user & {
      isFrozen?: boolean;
    };
    if (u.isFrozen) throw new UnauthorizedError("تم تجميد حسابك");

    req.user = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: "super_admin",
      hiringCompanyId: null,
      clientCompanyId: null,
    };
    next();
    return;
  }

  // ── Hiring company user ──────────────────────
  if (hiringSession) {
    const u = hiringSession.user as typeof hiringSession.user & {
      isFrozen?: boolean;
      hiringCompanyId?: string;
    };
    if (u.isFrozen) throw new UnauthorizedError("تم تجميد حسابك");

    const hiringCompanyId = u.hiringCompanyId ?? null;
    if (hiringCompanyId) {
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

    req.user = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: "company_user",
      hiringCompanyId,
      clientCompanyId: null,
    };
    next();
    return;
  }

  // ── Client company user ──────────────────────
  if (clientSession) {
    const u = clientSession.user as typeof clientSession.user & {
      isFrozen?: boolean;
      clientCompanyId?: string;
    };
    if (u.isFrozen) throw new UnauthorizedError("تم تجميد حسابك");

    const clientCompanyId = u.clientCompanyId ?? null;
    if (clientCompanyId) {
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
      role: "client_company_user",
      hiringCompanyId: null,
      clientCompanyId,
    };
    next();
    return;
  }

  throw new UnauthorizedError();
}

export function requireRole(...roles: Array<"super_admin" | "company_user" | "client_company_user">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    if (!roles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}
