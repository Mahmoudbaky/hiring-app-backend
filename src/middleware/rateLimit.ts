import rateLimit from "express-rate-limit";
import { buildErrorBody } from "../utils/response.js";

function limiter(windowMinutes: number, limit: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(buildErrorBody(message));
    },
  });
}

/** Sign-in / password endpoints: 10 attempts per 15 min per IP. */
export const authLimiter = limiter(15, 10, "محاولات كثيرة، يرجى المحاولة لاحقاً");

/** OTP send + verify: 10 requests per 15 min per IP. */
export const otpLimiter = limiter(15, 10, "طلبات كثيرة لرمز التحقق، يرجى المحاولة لاحقاً");

/** Company self-registration: 5 per hour per IP. */
export const registerLimiter = limiter(60, 5, "محاولات تسجيل كثيرة، يرجى المحاولة لاحقاً");
