import { Router } from "express";
import authRoutes from "./authRoute.js";
import productRoutes from "./productRoute.js";
import dashboardRoutes from "./dashboardRoute.js";
import offerRoutes from "./offerRoute.js";
import orderRoutes from "./orderRoute.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

const router = Router();

// Auth routes (login/refresh are public, logout/me are protected within authRoute)
router.use("/auth", authRoutes);

// All other admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.use("/products", productRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/offers", offerRoutes);
router.use("/orders", orderRoutes);

export default router;
