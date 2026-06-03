import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";
import * as ctrl from "../controllers/clientApplicant.controller.js";

const router: Router = Router();

router.get("/company/mine", requireAuth, requireRole("client_company_user"), ctrl.getMyCompany);
router.get("/", requireAuth, requireRole("client_company_user"), ctrl.listApplicants);
router.get("/:id", requireAuth, requireRole("client_company_user"), ctrl.getApplicant);
router.patch("/:id/status", requireAuth, requireRole("client_company_user"), ctrl.updateStatus);

export default router;
