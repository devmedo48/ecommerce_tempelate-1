import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// Import middleware
import {
  corsOptions,
  generalRateLimit,
  helmetConfig,
  compressionConfig,
  securityHeaders,
  requestLogger,
} from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Import routes
import mainRoutes from "./routes/index.js";

// Import services
import * as notificationService from "./services/notificationService.js";

// Import controllers
import { healthCheck } from "./controllers/health.controller.js";

// Import utilities
import { logger } from "./utils/logger.js";
import prisma from "./config/database.js";
import { setupSignalHandlers } from "./utils/shutdown.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security and middleware setup
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(compressionConfig);
app.use(securityHeaders);
app.use(generalRateLimit);

// Logging middleware
app.use(
  morgan("combined", {
    stream: {
      write: (message) => {
        if (message.includes(" 500 ")) {
          logger.error(message.trim());
        } else if (message.includes(" 400 ")) {
          logger.warn(message.trim());
        } else {
          logger.info(message.trim());
        }
      },
    },
  })
);

app.use(requestLogger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (before other routes)
app.get("/v1/health", healthCheck);

// API routes
app.use("/v1", mainRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Delivery Service API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 404 handler
app.use(notFound);

// Make services available globally
app.locals.notificationService = notificationService;

// Global error handler
app.use(errorHandler);

// Setup graceful shutdown signals
setupSignalHandlers(app);

async function start() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${port}/v1/health`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
