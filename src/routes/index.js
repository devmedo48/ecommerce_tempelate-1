import { Router } from "express";
import customerRoutes from "./customer/index.js";
import adminRoutes from "./admin/index.js";
import authRoutes from "./authRoute.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/customer", customerRoutes);
router.use("/admin", adminRoutes);

export default router;