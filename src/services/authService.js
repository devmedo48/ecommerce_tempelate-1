import prisma from "../config/database.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateDeviceHash,
} from "../utils/jwt.js";
import { hashToken, hashPassword, comparePassword } from "../utils/password.js"; // Reusing password utils for OTP hashing if needed
import AppError  from "../utils/appError.js";
import * as notificationService from "./notificationService.js";

/**
 * Requests an OTP for login.
 * @param {string} email - User email
 * @param {string} [phone] - Optional phone for SMS (if email is identifier but we want SMS)
 */
export async function requestLoginOtp(email) {
  // 1. Check if user exists, if not create basic record (Auto-signup for customers)
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: "CUSTOMER",
      },
    });
  }

  // 2. Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await hashPassword(otp); // Using bcrypt to hash OTP in DB
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // 3. Save to DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: hashedOtp,
      otpExpiry: expiry,
    },
  });

  // 4. Send Notification
  // Priority: Email for now based on input, but plan says OTP-only (Email)
  await notificationService.addToQueue(
    "EMAIL",
    email,
    `Your login code is: ${otp}`,
    "Login Verification"
  );

  return { message: "OTP sent successfully" };
}

/**
 * Verifies OTP and logs in the user.
 * @param {string} email
 * @param {string} otp
 * @param {string} userAgent
 */
export async function verifyLoginOtp(email, otp, userAgent) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otpCode || !user.otpExpiry) {
    throw new AppError("Invalid request", 400);
  }

  if (user.otpExpiry < new Date()) {
    throw new AppError("OTP has expired", 400);
  }

  const isValid = await comparePassword(otp, user.otpCode);
  if (!isValid) {
    throw new AppError("Invalid OTP", 400);
  }

  // Clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: null, otpExpiry: null },
  });

  // Generate Tokens
  return generateTokens(user, userAgent);
}

/**
 * Generates Access and Refresh tokens and stores Refresh Token in DB.
 */
async function generateTokens(user, userAgent) {
  const deviceHash = generateDeviceHash(userAgent);

  // Create payload
  const payload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshTokenString = generateRefreshToken(payload); // JWT string

  // Store in DB
  // Optional: Revoke old tokens for this device? Or allow multiple?
  // Let's revoke old ones for this device to keep it clean (Rotation)
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, deviceId: deviceHash },
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      deviceId: deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days matching JWT
    },
  });

  return { accessToken, refreshToken: refreshTokenString, user };
}

/**
 * Refreshes access token using refresh token.
 */
export async function refreshAccessToken(tokenString, userAgent) {
  // Verify JWT signature
  const decoded = verifyRefreshToken(tokenString);
  const deviceHash = generateDeviceHash(userAgent);

  // Check DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: tokenString },
    include: { user: true },
  });

  if (!storedToken) {
    // Reuse detection? If we can't find it but it's valid JWT, maybe hacked.
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError("Refresh token expired", 401);
  }

  // Generate new pair (Rotation)
  return generateTokens(storedToken.user, userAgent);
}

/**
 * Logs out user (revokes refresh token).
 */
export async function logout(tokenString) {
  try {
    await prisma.refreshToken.delete({
      where: { token: tokenString },
    });
  } catch (err) {
    // Ignore if not found
  }
}
