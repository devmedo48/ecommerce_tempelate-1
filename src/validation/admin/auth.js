import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const adminRefreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
});
