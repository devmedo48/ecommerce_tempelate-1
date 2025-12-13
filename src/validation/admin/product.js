import { z } from "zod";
import { paginationSchema, uuidSchema } from "../common.js";

const modifierOptionSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0).default(0),
});

const modifierSchema = z.object({
  name: z.string().min(1).max(100),
  isRequired: z.boolean().default(false),
  multiSelect: z.boolean().default(false),
  options: z.array(modifierOptionSchema).min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  modifiers: z.array(modifierSchema).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const adminGetProductsSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export const adminProductIdSchema = z.object({
  id: uuidSchema,
});
