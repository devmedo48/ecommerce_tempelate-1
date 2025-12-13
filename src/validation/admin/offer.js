import { z } from "zod";
import { paginationSchema, uuidSchema } from "../common.js";

export const createOfferSchema = z
  .object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.number().positive(),
    scope: z.enum(["GLOBAL", "PRODUCT"]),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    productIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (
        data.scope === "PRODUCT" &&
        (!data.productIds || data.productIds.length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Product IDs are required for PRODUCT scope offers",
      path: ["productIds"],
    }
  )
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const updateOfferSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    value: z.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    productIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export const getOffersSchema = paginationSchema.extend({
  scope: z.enum(["GLOBAL", "PRODUCT"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const offerIdSchema = z.object({
  id: uuidSchema,
});
