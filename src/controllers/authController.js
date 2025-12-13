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

/**
 * @desc Register with email and password
 * @route POST /api/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } =
    req.validatedData || req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const { registerWithPassword } = await import("../services/authService.js");
  const { accessToken, refreshToken, user } = await registerWithPassword(
    { email, password, firstName, lastName, phone },
    userAgent
  );

  res.status(201).json({
    success: true,
    message: "Account created successfully",
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
 * @desc Login with email and password
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData || req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const { loginWithPassword } = await import("../services/authService.js");
  const { accessToken, refreshToken, user } = await loginWithPassword(
    email,
    password,
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
 * @desc Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const { getCurrentUser } = await import("../services/authService.js");
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});
