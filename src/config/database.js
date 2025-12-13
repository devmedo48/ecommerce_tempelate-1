import "dotenv/config";
import { PrismaClient } from "../generated/prisma/index.js";
import { logger } from "../utils/logger.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  if (process.env.NODE_ENV === "development") {
    logger.debug("Query: " + e.query);
    logger.debug("Params: " + e.params);
    logger.debug("Duration: " + e.duration + "ms");
  }
});

prisma.$on("error", (e) => {
  logger.error("Database error:" + JSON.stringify(e));
});

prisma.$on("info", (e) => {
  logger.info("Database info:" + JSON.stringify(e));
});

prisma.$on("warn", (e) => {
  logger.warn("Database warning:" + JSON.stringify(e));
});

export default prisma;
