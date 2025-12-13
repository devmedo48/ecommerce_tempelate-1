import { z } from "zod";
import { paginationSchema, uuidSchema } from "../common.js";

export const getProductsSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
});

export const getProductSchema = z.object({
  id: uuidSchema,
});
