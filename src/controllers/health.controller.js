import prisma from "../config/database.js";
import { logger } from "../utils/logger.js";

export async function healthCheck(req, res) {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
      services: {},
      memory: {},
      cpu: {},
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = "healthy";
    } catch (error) {
      health.services.database = "unhealthy";
      health.status = "unhealthy";
      logger.error("Database health check failed:", error);
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
      external: Math.round(memUsage.external / 1024 / 1024) + " MB",
    };

    // Check CPU usage
    const cpuUsage = process.cpuUsage();
    health.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}
