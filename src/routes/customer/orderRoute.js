import { Router } from "express";
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

router.post("/", validate(placeOrderSchema), placeOrder);
router.get("/", validate(paginationSchema, "query"), getOrders);
router.get("/:id", validate({ params: { id: uuidSchema } }), getOrder);
router.put(
  "/:id/cancel",
  validate({ params: { id: uuidSchema } }),
  cancelOrder
);

export default router;
