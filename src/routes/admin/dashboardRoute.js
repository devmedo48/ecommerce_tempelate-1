import { Router } from "express";
import { getDashboardStats } from "../../controllers/admin/dashboardController.js";

const router = Router();

router.get("/", getDashboardStats);

export default router;
