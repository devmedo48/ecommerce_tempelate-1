import { Router } from "express";
import {
  getDashboardStats,
  getAnalytics,
} from "../../controllers/admin/dashboardController.js";

const router = Router();

router.get("/", getDashboardStats);
router.get("/analytics", getAnalytics);

export default router;
