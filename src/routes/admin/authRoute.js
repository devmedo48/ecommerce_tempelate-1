import { Router } from "express";
import { validate } from "../../validation/index.js";
import {
  adminLoginSchema,
  adminRefreshTokenSchema,
} from "../../validation/admin/auth.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import {
  login,
  refreshToken,
  logout,
  getMe,
} from "../../controllers/admin/authController.js";

const router = Router();

// Public routes (no auth required)
router.post("/login", validate(adminLoginSchema), login);
router.post("/refresh-token", validate(adminRefreshTokenSchema), refreshToken);

// Protected routes (require admin auth)
router.post("/logout", authenticate, requireAdmin, logout);
router.get("/me", authenticate, requireAdmin, getMe);

export default router;
