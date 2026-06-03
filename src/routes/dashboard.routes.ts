import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import { dashboardController } from "../controllers/dashboard.controller.js";

const router: IRouter = Router();

router.get(
  "/",
  requireAuth,
  requireRole("super_admin"),
  dashboardController.getSummary
);

router.get(
  "/company",
  requireAuth,
  requireRole("company_user"),
  dashboardController.getCompanySummary
);

export default router;
