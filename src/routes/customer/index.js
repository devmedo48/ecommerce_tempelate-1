import { Router } from "express";
import orderRoute from "./orderRoute.js";
import productRoute from "./productRoute.js";
import reviewRoute from "./reviewRoute.js";
import addressRoute from "./addressRoute.js";
import paymentRoute from "./paymentRoute.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

// Public routes (no auth required)
router.use("/products", productRoute);
router.use("/reviews", reviewRoute);

// Protected routes (auth required)
router.use("/orders", authenticate, orderRoute);
router.use("/addresses", authenticate, addressRoute);
router.use("/payments", authenticate, paymentRoute);

export default router;
