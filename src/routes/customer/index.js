import { Router } from "express";
import orderRoute from "./orderRoute.js";
import productRoute from "./productRoute.js";
import reviewRoute from "./reviewRoute.js";
import addressRoute from "./addressRoute.js";
import paymentRoute from "./paymentRoute.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.use("/products", productRoute);
router.use("/orders", orderRoute);
router.use("/reviews", reviewRoute);
router.use("/addresses", addressRoute);
router.use("/payments", paymentRoute);

export default router;
