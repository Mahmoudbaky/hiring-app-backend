import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { adminAuth, companyAuth, companyAccessError, getCompanyStatus } from "../lib/auth.js";
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

// better-auth cookie names: "<prefix>.session_token", or with
// "__Secure-" in front when secure cookies are on.
function hasCookie(cookieHeader: string, prefix: string): boolean {
  return (
    cookieHeader.includes(`${prefix}.session_token=`) ||
    cookieHeader.includes(`__Secure-${prefix}.session_token=`)
  );
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const cookieHeader = req.headers.cookie ?? "";
  const headers = fromNodeHeaders(req.headers);

  // ── Super admin ──────────────────────────────
  // Only ask the instance whose cookie is present.
  if (hasCookie(cookieHeader, "admin")) {
    const session = await adminAuth.api.getSession({ headers });
    if (session) {
      if (session.user.isFrozen) throw new UnauthorizedError("تم تجميد حسابك");
      req.user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: "super_admin",
        hiringCompanyId: null,
        clientCompanyId: null,
      };
      next();
      return;
    }
  }

  // ── Company user (hiring or client) ──────────
  if (hasCookie(cookieHeader, "company")) {
    const session = await companyAuth.api.getSession({ headers });
    if (session) {
      const u = session.user;
      const companyType = u.companyType as "hiring" | "client";
      const hiringCompanyId = companyType === "hiring" ? (u.hiringCompanyId ?? null) : null;
      const clientCompanyId = companyType === "client" ? (u.clientCompanyId ?? null) : null;

      // Re-check on every request so freezing a user/company takes effect
      // immediately, not only at the next sign-in.
      const error = companyAccessError(
        !!u.isFrozen,
        await getCompanyStatus({ companyType, hiringCompanyId, clientCompanyId })
      );
      if (error) throw new ForbiddenError(error);

      req.user = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: companyType === "hiring" ? "company_user" : "client_company_user",
        hiringCompanyId,
        clientCompanyId,
      };
      next();
      return;
    }
  }

  throw new UnauthorizedError("يرجى تسجيل الدخول");
}

export function requireRole(...roles: Array<"super_admin" | "company_user" | "client_company_user">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError("يرجى تسجيل الدخول");
    if (!roles.includes(req.user.role)) throw new ForbiddenError("ليس لديك صلاحية للوصول");
    next();
  };
}
