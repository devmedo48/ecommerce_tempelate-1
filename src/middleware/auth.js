import AppError from "../utils/appError.js";
import { asyncHandler } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../config/database.js";

const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  try {
    const decoded = verifyAccessToken(token);
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    if (!currentUser.isActive) {
      return next(
        new AppError(
          "User account is deactivated. Please contact support.",
          401
        )
      );
    }

    req.user = currentUser;
    next();
  } catch {
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
});

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = authorize("ADMIN");
