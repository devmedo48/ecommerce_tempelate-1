import { z } from "zod";
import { emailSchema } from "../common.js";

export const requestLoginOtpSchema = z.object({
  email: emailSchema,
});

export const verifyLoginOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string({ required_error: "OTP is required" })
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const updateProfileSchema = z.object({
  firstName: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name must contain only letters"),
  lastName: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name must contain only letters"),
  gender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Gender must be male, female, or other" }),
    })
    .optional(),
  birthDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format. Use YYYY-MM-DD",
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: "Birth date cannot be in the future",
    })
    .refine(
      (date) => {
        const age = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24 * 365);
        return age >= 13;
      },
      {
        message: "You must be at least 13 years old",
      }
    )
    .optional(),
});

// Aliases for customer auth routes
export const sendOtpSchema = requestLoginOtpSchema;
export const verifyOtpSchema = verifyLoginOtpSchema;

// Google OAuth Schema
export const googleLoginSchema = z.object({
  idToken: z.string({ required_error: "Google ID token is required" }),
});

// Refresh Token Schema
export const customerRefreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
});
