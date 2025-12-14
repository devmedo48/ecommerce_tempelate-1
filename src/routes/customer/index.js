import { Router } from "express";
import authRoute from "./authRoute.js";
import orderRoute from "./orderRoute.js";
import productRoute from "./productRoute.js";
import reviewRoute from "./reviewRoute.js";
import addressRoute from "./addressRoute.js";
import cartRoute from "./cartRoute.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Auth routes (send-otp, verify-otp are public; profile/logout are protected within authRoute)
router.use("/auth", authRoute);

// Public routes (no auth required)
router.use("/products", productRoute);
router.use("/reviews", reviewRoute);

// Protected routes (auth required)
router.use("/orders", authenticate, orderRoute);
router.use("/addresses", authenticate, addressRoute);
router.use("/cart", authenticate, cartRoute);

export default router;
