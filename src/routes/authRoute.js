import { Router } from "express";
import {
  requestLoginOtpSchema,
  verifyLoginOtpSchema,
  validate,
} from "../validation/index.js";
import { authenticate } from "../middleware/auth.js";
import {
  requestOtp,
  verifyOtp,
  refreshToken,
  logoutUser,
} from "../controllers/authController.js";

const router = Router();

// Public Routes
router.post("/request-otp", validate(requestLoginOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyLoginOtpSchema), verifyOtp);
router.post("/refresh-token", refreshToken);

// Protected Routes
router.post("/logout", authenticate, logoutUser);

export default router;
