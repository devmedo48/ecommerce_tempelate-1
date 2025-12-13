import { z } from "zod";
// import { phoneSchema } from "../common.js";

export const addressSchema = z.object({
  street: z
    .string({ required_error: "Street is required" })
    .min(3, "Street must be at least 3 characters")
    .max(100, "Street must not exceed 100 characters"),
  city: z
    .string({ required_error: "City is required" })
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  country: z.string().default("Egypt"),
  label: z.string().max(50, "Label must not exceed 50 characters").optional(),
  isDefault: z.boolean().default(false),
});
