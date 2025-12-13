import { z } from "zod";
import { paginationSchema, uuidSchema } from "../common.js";

// Order Status enum matching Prisma schema
export const OrderStatus = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
]);

export const adminGetOrdersSchema = paginationSchema.extend({
  status: OrderStatus.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
});

export const adminOrderIdSchema = z.object({
  id: uuidSchema,
});

export const updateOrderStatusSchema = z.object({
  status: OrderStatus,
});
