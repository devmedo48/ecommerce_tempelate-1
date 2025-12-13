import { z } from "zod";
import { uuidSchema, paginationSchema } from "../common.js";

export const createReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(500).optional(),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "At least one of rating or comment must be provided",
  });

export const reviewIdSchema = z.object({
  id: uuidSchema,
});

export const getProductReviewsParamsSchema = z.object({
  productId: uuidSchema,
});

export const getProductReviewsQuerySchema = paginationSchema;
