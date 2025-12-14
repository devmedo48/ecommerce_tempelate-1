/**
 * Admin Coupon Routes
 */

import { Router } from "express";
import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../controllers/admin/couponController.js";
import { validate } from "../../validation/index.js";
import {
  createCouponSchema,
  updateCouponSchema,
} from "../../validation/admin/coupon.js";

const router = Router();

router.get("/", getCoupons);
router.get("/:id", getCoupon);
router.post("/", validate(createCouponSchema), createCoupon);
router.put("/:id", validate(updateCouponSchema), updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
