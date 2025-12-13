import prisma from "../config/database.js";
import { logger } from "../utils/logger.js";

export async function gracefulShutdown(server, signal) {
  logger.info(`Graceful shutdown initiated by ${signal}`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Close database connection
      await prisma.$disconnect();
      logger.info("Database connection closed");

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during graceful shutdown:", error);
      process.exit(1);
    }
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
}

export function setupSignalHandlers(server) {
  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    gracefulShutdown(server, "uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown(server, "unhandledRejection");
  });

  // Handle SIGTERM
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received");
    gracefulShutdown(server, "SIGTERM");
  });

  // Handle SIGINT
  process.on("SIGINT", () => {
    logger.info("SIGINT received");
    gracefulShutdown(server, "SIGINT");
  });
}
