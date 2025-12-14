import prisma from "../config/database.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateDeviceHash,
} from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";
import AppError from "../utils/appError.js";

/**
 * Admin login with email and password.
 * @param {string} email
 * @param {string} password
 * @param {string} userAgent
 */
export async function adminLogin(email, password, userAgent) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Ensure user is an admin
  if (user.role !== "ADMIN") {
    throw new AppError("Access denied. Admin privileges required.", 403);
  }

  if (!user.password) {
    throw new AppError("Password not set for this account", 400);
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is disabled", 403);
  }

  return generateAdminTokens(user, userAgent);
}

/**
 * Generates Access and Refresh tokens for admin and stores Refresh Token in DB.
 */
async function generateAdminTokens(user, userAgent) {
  const deviceHash = generateDeviceHash(userAgent);

  const payload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshTokenString = generateRefreshToken(payload);

  // Revoke old tokens for this device
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, deviceId: deviceHash },
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      deviceId: deviceHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenString,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}

/**
 * Refreshes access token using refresh token.
 */
export async function adminRefreshToken(tokenString, userAgent) {
  // Verify token is valid JWT (throws if invalid)
  verifyRefreshToken(tokenString);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: tokenString },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Ensure user is still an admin
  if (storedToken.user.role !== "ADMIN") {
    throw new AppError("Access denied. Admin privileges required.", 403);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError("Refresh token expired", 401);
  }

  return generateAdminTokens(storedToken.user, userAgent);
}

/**
 * Admin logout - revokes refresh token.
 */
export async function adminLogout(tokenString) {
  try {
    await prisma.refreshToken.delete({
      where: { token: tokenString },
    });
  } catch {
    // Ignore if not found
  }
}

/**
 * Get current admin user info.
 */
export async function getAdminProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "ADMIN") {
    throw new AppError("Access denied", 403);
  }

  return user;
}
