import { z } from "zod";

export const emailSchema = z.email("Invalid email format");
export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters");

export const cuidSchema = z.cuid("Invalid CUID format");
export const uuidSchema = z.uuid("Invalid UUID format");

export const paginationSchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .default("10"),
});
