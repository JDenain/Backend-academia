import { Router } from "express";
import { getReportStats } from "../controllers/report.controller.js";
import { authenticateToken } from "../controllers/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/api/reports/stats", getReportStats);

export default router;
