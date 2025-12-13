import { asyncHandler } from "../middleware/errorHandler.js";
import {
  requestLoginOtp,
  verifyLoginOtp,
  refreshAccessToken,
  logout,
} from "../services/authService.js";

/**
 * @desc Request OTP for login (auto-signup if new)
 * @route POST /api/auth/request-otp
 * @access Public
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body; // or req.validatedData
  const result = await requestLoginOtp(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * @desc Verify OTP and Login
 * @route POST /api/auth/verify-otp
 * @access Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body; // or req.validatedData
  const userAgent = req.headers["user-agent"] || "unknown";

  const { accessToken, refreshToken, user } = await verifyLoginOtp(
    email,
    otp,
    userAgent
  );

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      refreshToken,
      user,
    },
  });
});

/**
 * @desc Refresh Access Token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const result = await refreshAccessToken(token, userAgent);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: result,
  });
});

/**
 * @desc Logout
 * @route POST /api/auth/logout
 * @access Private/Public
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  // If we want to support logout from client without sending Body, we might need to change this logic
  // But usually client sends RT to revoke it.

  if (token) {
    await logout(token);
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

