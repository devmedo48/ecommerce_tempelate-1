import { Router } from "express";
import {
  requestLoginOtpSchema,
  verifyLoginOtpSchema,
  loginSchema,
  registerSchema,
  validate,
} from "../validation/index.js";
import { authenticate } from "../middleware/auth.js";
import {
  requestOtp,
  verifyOtp,
  refreshToken,
  logoutUser,
  login,
  register,
  getMe,
} from "../controllers/authController.js";

const router = Router();

// Email/Password Routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// OTP Routes (legacy)
router.post("/request-otp", validate(requestLoginOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyLoginOtpSchema), verifyOtp);

// Token Routes
router.post("/refresh-token", refreshToken);

// Protected Routes
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logoutUser);

export default router;
