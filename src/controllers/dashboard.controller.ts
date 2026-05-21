import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { sendSuccess } from "../utils/response.js";

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard summary (super_admin only)
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days for the chart data (7, 30, or 90)
 *     responses:
 *       200:
 *         description: Dashboard data
 */
export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    const [stats, chart, topDepartments, recentRequests] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getChartData(days),
      dashboardService.getTopDepartments(),
      dashboardService.getRecentRequests(),
    ]);

    sendSuccess(
      res,
      { stats, chart, topDepartments, recentRequests },
      "Dashboard data fetched"
    );
  },
};
