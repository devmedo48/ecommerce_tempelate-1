import prisma from "../../config/database.js";
import { asyncHandler } from "../../middleware/errorHandler.js";
import AppError from "../../utils/appError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateDeviceHash,
} from "../../utils/jwt.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import * as notificationService from "../../services/notificationService.js";

/**
 * Generate tokens for customer
 */
async function generateCustomerTokens(user, userAgent) {
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

  return { accessToken, refreshToken: refreshTokenString, user };
}

/**
 * @desc Request OTP for login (auto-signup if new customer)
 * @route POST /api/customer/auth/send-otp
 * @access Public
 */
export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.validatedData || req.body;

  // Check if user exists, if not create basic record (Auto-signup for customers)
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: "CUSTOMER",
        customer: { create: {} },
      },
    });
  }

  // Ensure user is a customer
  if (user.role !== "CUSTOMER") {
    throw new AppError("Please use admin login for this account", 400);
  }

  // Generate OTP
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = "123456";
  const hashedOtp = await hashPassword(otp);
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Save to DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: hashedOtp,
      otpExpiry: expiry,
    },
  });

  // Send Notification
  await notificationService.addToQueue(
    "EMAIL",
    email,
    `Your login code is: ${otp}`,
    "Login Verification"
  );

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

/**
 * @desc Verify OTP and Login
 * @route POST /api/customer/auth/verify-otp
 * @access Public
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.validatedData || req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otpCode || !user.otpExpiry) {
    throw new AppError("Invalid request", 400);
  }

  if (user.role !== "CUSTOMER") {
    throw new AppError("Please use admin login for this account", 400);
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
  const { accessToken, refreshToken } = await generateCustomerTokens(
    user,
    userAgent
  );

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
});

/**
 * @desc Login with Google
 * @route POST /api/customer/auth/google-login
 * @access Public
 */
// eslint-disable-next-line no-unused-vars
export const loginWithGoogle = asyncHandler(async (req, res) => {
  // TODO: Implement Google OAuth verification
  // For now, throw not implemented
  throw new AppError("Google login not implemented yet", 501);
});

/**
 * @desc Refresh customer access token
 * @route POST /api/customer/auth/refresh-token
 * @access Public
 */
export const refreshCustomerToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.validatedData || req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  if (!token) {
    throw new AppError("Refresh token is required", 400);
  }

  // Find refresh token in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new AppError("Refresh token expired", 401);
  }

  // Ensure it's a customer
  if (storedToken.user.role !== "CUSTOMER") {
    throw new AppError("Invalid token for this endpoint", 401);
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } =
    await generateCustomerTokens(storedToken.user, userAgent);

  // Delete old token
  await prisma.refreshToken.delete({ where: { token } });

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

/**
 * @desc Logout customer
 * @route POST /api/customer/auth/logout
 * @access Private
 */
export const logoutCustomer = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token) {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      });
    } catch {
      // Ignore if not found
    }
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc Logout from all devices
 * @route POST /api/customer/auth/logout-all-devices
 * @access Private
 */
export const logoutAllCustomerDevices = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  res.status(200).json({
    success: true,
    message: "Logged out from all devices",
  });
});

/**
 * @desc Link Google account
 * @route POST /api/customer/auth/google-link
 * @access Private
 */
// eslint-disable-next-line no-unused-vars
export const googleLink = asyncHandler(async (req, res) => {
  // TODO: Implement Google account linking
  throw new AppError("Google link not implemented yet", 501);
});

/**
 * @desc Unlink Google account
 * @route PUT /api/customer/auth/google-unlink
 * @access Private
 */
// eslint-disable-next-line no-unused-vars
export const googleUnlink = asyncHandler(async (req, res) => {
  // TODO: Implement Google account unlinking
  throw new AppError("Google unlink not implemented yet", 501);
});

/**
 * @desc Update customer profile
 * @route PUT /api/customer/auth/profile
 * @access Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const data = req.validatedData || req.body;
  const userId = req.user.id;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
});

/**
 * @desc Get customer profile
 * @route GET /api/customer/auth/profile
 * @access Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

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

  res.status(200).json({
    success: true,
    data: user,
  });
});
