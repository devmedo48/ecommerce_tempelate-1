/**
 * Admin Coupon Validation Schemas
 */

import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string({ required_error: "Coupon code is required" })
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must not exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Code can only contain letters, numbers, - and _"),
  type: z.enum(["PERCENTAGE", "FIXED"], {
    required_error: "Discount type is required",
  }),
  value: z
    .number({ required_error: "Value is required" })
    .positive("Value must be positive"),
  minPurchase: z.number().min(0).optional(),
  limit: z.number().int().positive().optional().nullable(),
  expireAt: z.string({ required_error: "Expiry date is required" }),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must not exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Code can only contain letters, numbers, - and _")
    .optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().positive("Value must be positive").optional(),
  minPurchase: z.number().min(0).optional(),
  limit: z.number().int().positive().optional().nullable(),
  expireAt: z.string().optional(),
  isActive: z.boolean().optional(),
});
