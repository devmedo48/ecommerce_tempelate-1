import { Router } from "express";
import customerRoutes from "./customer/index.js";
import adminRoutes from "./admin/index.js";
import webhookRoutes from "./webhookRoute.js";

const router = Router();

// Customer routes include /auth for OTP-based login
router.use("/customer", customerRoutes);

// Admin routes include /auth for password-based login
router.use("/admin", adminRoutes);

// Webhook routes for external services (Moyasar, etc.)
router.use("/webhooks", webhookRoutes);

export default router;
