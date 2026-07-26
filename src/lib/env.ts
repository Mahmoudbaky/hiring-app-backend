import dotenv from "dotenv";
import path from "node:path";

const nodeEnv = process.env.NODE_ENV ?? "development";
const envFile = nodeEnv === "production" ? ".env.production" : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// FRONTEND_URL supports a comma-separated list (e.g. "http://a.com,http://b.com")
// so multiple frontends (web, staging, mobile webview, ...) can share one backend.
export const frontendUrls: string[] = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const frontendUrl = frontendUrls[0];
