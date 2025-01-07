import { EventCollector } from "@/lib/nous/observe/collector";
import { SignalCoordinator } from "@/lib/nous/observe/coordinator";
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

interface ServiceConfig {
  redis?: {
    url: string;
  };
  environment?: string;
}

/**
 * Service Manager for Nous Observe Module
 * Manages service lifecycle and dependencies
 */
export class ServiceManager {
  private static instance: ServiceManager;
  private prisma = prisma;
  private redis: Redis | null = null;
  private signalCoordinator: SignalCoordinator | null = null;
  private eventCollector: EventCollector | null = null;

  private constructor(config: ServiceConfig) {
    this.prisma = prisma;

    if (config.redis?.url) {
      this.initializeRedis(config.redis.url);
    }
  }

  private async initializeRedis(url: string): Promise<void> {
    this.redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      },
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      commandTimeout: 5000,
    });
    this.redis.on("error", (error) => {
      logger.error("Redis error", { error });
    });

    this.redis.on("connect", () => {
      logger.info("Redis connected");
    });
  }

  static getInstance(config?: ServiceConfig): ServiceManager {
    if (!ServiceManager.instance && config) {
      ServiceManager.instance = new ServiceManager(config);
    }
    if (!ServiceManager.instance) {
      throw new Error("ServiceManager not initialized");
    }
    return ServiceManager.instance;
  }

  getSignalCoordinator(): SignalCoordinator {
    if (!this.signalCoordinator) {
      this.signalCoordinator = new SignalCoordinator();
      logger.info("Signal Coordinator initialized");
    }
    return this.signalCoordinator;
  }

  getEventCollector(): EventCollector {
    if (!this.eventCollector) {
      this.eventCollector = new EventCollector();
      logger.info("Event Collector initialized");
    }
    return this.eventCollector;
  }

  getPrisma(): PrismaClient {
    return this.prisma;
  }

  getRedis(): Redis | null {
    return this.redis;
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down services...");

    if (this.redis) {
      await this.redis.quit();
      logger.info("Redis disconnected");
    }

    if (this.prisma) {
      await this.prisma.$disconnect();
      logger.info("Prisma disconnected");
    }
  }
}

// Initialize with config from environment
const redisUrl = process.env.NOUS_REDIS_URL?.trim();

export const serviceManager = ServiceManager.getInstance({
  redis: redisUrl ? { url: redisUrl } : undefined,
  environment: process.env.NODE_ENV || "development",
});
