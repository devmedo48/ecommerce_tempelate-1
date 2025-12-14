/**
 * Cart Routes - Customer
 */

import { Router } from "express";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  syncCart,
} from "../../controllers/customer/cartController.js";
import {
  validate,
  addCartItemSchema,
  updateCartItemSchema,
  syncCartSchema,
  cartItemParamSchema,
} from "../../validation/index.js";

const router = Router();

/**
 * @route GET /api/v1/customer/cart
 * @desc Get user's cart
 */
router.get("/", getCart);

/**
 * @route POST /api/v1/customer/cart/items
 * @desc Add item to cart
 */
router.post("/items", validate({ body: addCartItemSchema }), addItem);

/**
 * @route PUT /api/v1/customer/cart/items/:itemId
 * @desc Update cart item quantity
 */
router.put(
  "/items/:itemId",
  validate({ params: cartItemParamSchema, body: updateCartItemSchema }),
  updateItem
);

/**
 * @route DELETE /api/v1/customer/cart/items/:itemId
 * @desc Remove item from cart
 */
router.delete(
  "/items/:itemId",
  validate({ params: cartItemParamSchema }),
  removeItem
);

/**
 * @route DELETE /api/v1/customer/cart
 * @desc Clear entire cart
 */
router.delete("/", clearCart);

/**
 * @route POST /api/v1/customer/cart/sync
 * @desc Sync client cart with server (merge)
 */
router.post("/sync", validate({ body: syncCartSchema }), syncCart);

export default router;
