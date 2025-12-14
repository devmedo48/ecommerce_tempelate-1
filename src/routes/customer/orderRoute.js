import { Router } from "express";
import { z } from "zod";
import {
  placeOrder,
  getOrders,
  getOrder,
  cancelOrder,
} from "../../controllers/customer/orderController.js";
import {
  validate,
  placeOrderSchema,
  uuidSchema,
  paginationSchema,
} from "../../validation/index.js";

const router = Router();

// Params schema for order ID
const orderIdParamsSchema = z.object({
  id: uuidSchema,
});

router.post("/", validate(placeOrderSchema), placeOrder);
router.get("/", validate(paginationSchema, "query"), getOrders);
router.get("/:id", validate({ params: orderIdParamsSchema }), getOrder);
router.put(
  "/:id/cancel",
  validate({ params: orderIdParamsSchema }),
  cancelOrder
);

export default router;
