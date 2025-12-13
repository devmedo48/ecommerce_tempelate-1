import express from "express";
import { validate } from "../../validation/index.js";
import {
  getProfile,
  googleLink,
  googleUnlink,
  loginWithGoogle,
  logoutAllCustomerDevices,
  logoutCustomer,
  sendOtp,
  updateProfile,
  verifyOTP,
} from "../../controllers/customer/authController.js";
import { authenticate } from "../../middleware/auth.js";
import {
  sendOtpSchema,
  updateProfileSchema,
  verifyOtpSchema,
  googleLoginSchema,
} from "../../validation/index.js";

const router = express.Router();

router.post("/send-otp", validate(sendOtpSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOTP);
router.post("/google-login", validate(googleLoginSchema), loginWithGoogle);

//** Protected routes *//
router.use(authenticate);

router.post("/logout", logoutCustomer);
router.post("/logout-all-devices", logoutAllCustomerDevices);

router.post("/google-link", googleLink);
router.put("/google-unlink", googleUnlink);

router.put("/profile", validate(updateProfileSchema), updateProfile);
router.get("/profile", getProfile);

export default router;
