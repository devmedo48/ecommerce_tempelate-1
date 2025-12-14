import { z } from "zod";

/**
 * Cart Item - Add to cart
 */
export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  modifiers: z
    .record(z.string(), z.union([z.string(), z.array(z.string())]))
    .optional(),
});

/**
 * Cart Item - Update quantity
 */
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

/**
 * Cart Sync - Sync client cart with server
 */
export const syncCartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).default(1),
      modifiers: z
        .record(z.string(), z.union([z.string(), z.array(z.string())]))
        .optional(),
    })
  ),
});

/**
 * Cart Item ID param
 */
export const cartItemParamSchema = z.object({
  itemId: z.string().uuid(),
});
