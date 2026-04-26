import "dotenv/config";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import { toNodeHandler } from "better-auth/node";
import { swaggerSpec } from "./lib/swagger.js";
import logger from "./lib/logger.js";
import { auth } from "./lib/auth.js";
import companiesRouter from "./routes/companies.routes.js";
import usersRouter from "./routes/users.routes.js";
import jobsRouter from "./routes/jobs.routes.js";
import requestsRouter from "./routes/requests.routes.js";
import settingsRouter from "./routes/settings.routes.js";
import applicantsRouter from "./routes/applicants.routes.js";

const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// ── better-auth handler (must be before express.json()) ──────────────────────
// Uses middleware instead of app.all() wildcard to stay compatible with Express 5
const authHandler = toNodeHandler(auth);
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl.startsWith("/api/auth/")) {
    authHandler(req as any, res as any);
    return;
  }
  next();
});

app.use(express.json());

// ── Request logger ───────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── API docs ─────────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/companies", companiesRouter);
app.use("/api/users", usersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/applicants", applicantsRouter);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API docs at http://localhost:${PORT}/api/docs`);
  logger.info(`Auth endpoints at http://localhost:${PORT}/api/auth`);
});

export default app;
