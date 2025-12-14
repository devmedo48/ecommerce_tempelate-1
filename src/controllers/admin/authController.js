import { asyncHandler } from "../../middleware/errorHandler.js";
import {
  adminLogin,
  adminRefreshToken,
  adminLogout,
  getAdminProfile,
} from "../../services/adminAuthService.js";

/**
 * @desc Admin login with email and password
 * @route POST /api/admin/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData || req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const { accessToken, refreshToken, user } = await adminLogin(
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
      user,
    },
  });
});

/**
 * @desc Refresh admin access token
 * @route POST /api/admin/auth/refresh-token
 * @access Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const userAgent = req.headers["user-agent"] || "unknown";

  const result = await adminRefreshToken(token, userAgent);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: result,
  });
});

/**
 * @desc Admin logout
 * @route POST /api/admin/auth/logout
 * @access Private (Admin)
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await adminLogout(token);
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc Get current admin info
 * @route GET /api/admin/auth/me
 * @access Private (Admin)
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await getAdminProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});
