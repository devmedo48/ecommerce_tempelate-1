import "dotenv/config";
import jwt from "jsonwebtoken";
import { logger } from "./logger.js";
import { createHash } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (
  !JWT_SECRET ||
  !JWT_REFRESH_SECRET ||
  !JWT_EXPIRES_IN ||
  !JWT_REFRESH_EXPIRES_IN
) {
  // console.log(process.env);
  throw new Error("JWT secrets are required");
}

export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "delivery-api",
      audience: "delivery-app",
    });
  } catch (error) {
    logger.error("Error generating access token:", error);
    throw new Error("Failed to generate access token");
  }
};

export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: "delivery-api",
      audience: "delivery-app",
    });
  } catch (error) {
    logger.error("Error generating refresh token:", error);
    throw new Error("Failed to generate refresh token");
  }
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: "delivery-api",
      audience: "delivery-app",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Access token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    }
    logger.error("Error verifying access token:", error);
    throw new Error("Failed to verify access token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "delivery-api",
      audience: "delivery-app",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    }
    logger.error("Error verifying refresh token:", error);
    throw new Error("Failed to verify refresh token");
  }
};

export const generateDeviceHash = (userAgent) => {
  if (userAgent.includes("PostmanRuntime")) {
    return createHash("sha256").update("Postman").digest("hex");
  }
  return createHash("sha256").update(userAgent).digest("hex");
};
