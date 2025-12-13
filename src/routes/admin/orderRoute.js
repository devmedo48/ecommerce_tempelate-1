import { Router } from "express";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
} from "../../controllers/admin/orderController.js";
import {
  validate,
  adminGetOrdersSchema,
  adminOrderIdSchema,
  updateOrderStatusSchema,
} from "../../validation/index.js";

const router = Router();

router.get("/", validate(adminGetOrdersSchema, "query"), getOrders);
router.get("/:id", validate({ params: adminOrderIdSchema }), getOrder);
router.put(
  "/:id/status",
  validate({ params: adminOrderIdSchema, body: updateOrderStatusSchema }),
  updateOrderStatus
);

export default router;
