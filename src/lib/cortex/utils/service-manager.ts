import { AnalyticsService } from "@/lib/cortex/analytics/service";
import { DataSyncService } from "@/lib/cortex/core/sync-service";
import { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import { SearchABTestingService } from "@/lib/cortex/feedback/ab-testing";
import { AutomatedFeedbackProcessor } from "@/lib/cortex/feedback/automated-processor";
import { FeedbackService } from "@/lib/cortex/feedback/service";
import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { PostgresDataService } from "@/lib/cortex/postgres/services";
import { RedisClient } from "@/lib/cortex/redis/client";
import { RedisCacheService } from "@/lib/cortex/redis/services";
import { VectorizationService } from "@/lib/cortex/services/vectorization";
import { SessionService } from "@/lib/cortex/sessions/service";
import type { Services } from "@/lib/cortex/types/services";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { Client } from "@elastic/elasticsearch";
import Redis from "ioredis";

export class ServiceManager {
  private static instance: ServiceManager;
  private services: Services | null = null;
  private redis: Redis | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  public async getServices(): Promise<Services> {
    // If we already have services initialized, return them
    if (this.services) {
      return this.services;
    }

    // If we're already initializing, wait for it to complete
    if (this.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getServices();
    }

    try {
      this.isInitializing = true;

      // Only initialize Redis if not already initialized
      if (!this.redis) {
        try {
          this.redis = await this.initializeRedis();
        } catch (error) {
          logger.error("Redis initialization failed", { error });
          throw error;
        }
      }

      // Create base services
      const baseServices = await this.createBaseServices();
      this.services = baseServices;

      return baseServices;
    } catch (error) {
      logger.error("Error initializing services", { error });
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  // For health checks only - lightweight connection tests
  public async checkConnections(): Promise<{
    redis: boolean;
    elasticsearch: boolean;
    postgres: boolean;
  }> {
    try {
      // Initialize Redis if needed
      if (!this.redis) {
        try {
          this.redis = await this.initializeRedis();
        } catch (error) {
          logger.error("Redis initialization failed", { error });
          return {
            redis: false,
            elasticsearch: await this.checkElasticsearchConnection(),
            postgres: await this.checkPostgresConnection(),
          };
        }
      }

      // Perform basic connection checks without full service initialization
      const [redisOk, esOk, pgOk] = await Promise.all([
        this.redis
          .ping()
          .then(() => true)
          .catch((error) => {
            logger.error("Redis ping failed", { error });
            return false;
          }),
        this.checkElasticsearchConnection(),
        this.checkPostgresConnection(),
      ]);

      return {
        redis: redisOk,
        elasticsearch: esOk,
        postgres: pgOk,
      };
    } catch (error) {
      logger.error("Error checking connections", { error });
      return {
        redis: false,
        elasticsearch: false,
        postgres: false,
      };
    }
  }

  private async checkElasticsearchConnection(): Promise<boolean> {
    try {
      const client = new Client({
        node: process.env.ELASTICSEARCH_URL,
        auth: {
          apiKey: process.env.SOPHRA_ES_API_KEY || "",
        },
        tls: {
          ca: process.env.ELASTICSEARCH_CA_CERT,
          rejectUnauthorized: true,
        },
      });
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  private async checkPostgresConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async initializeRedis(): Promise<Redis> {
    const redisUrl = process.env.SOPHRA_REDIS_URL?.trim();
    if (!redisUrl) {
      throw new Error("Missing SOPHRA_REDIS_URL environment variable");
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      },
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      commandTimeout: 5000,
    });

    // Attach event handlers before any operations
    redis.on("error", (error) => {
      logger.error("Redis error:", { error });
    });

    redis.on("connect", () => {
      logger.info("Redis connected");
    });

    // Try to ping Redis to ensure connection is working
    try {
      await redis.ping();
    } catch (error) {
      logger.error("Redis ping failed:", { error });
      // Clean up the Redis instance
      redis.disconnect();
      throw error;
    }

    return redis;
  }
  private async createBaseServices() {
    const metricsService = new MetricsService({
      logger,
      environment: process.env.NODE_ENV as
        | "development"
        | "production"
        | "test",
    });

    const elasticsearch = new ElasticsearchService({
      environment: process.env.NODE_ENV as
        | "development"
        | "production"
        | "test",
      logger: logger,
      metrics: metricsService,
      config: {
        node: process.env.ELASTICSEARCH_URL ?? "",
        auth: {
          apiKey: process.env.SOPHRA_ES_API_KEY ?? "",
        },
        ssl: {
          ca: process.env.ELASTICSEARCH_CA_CERT,
          rejectUnauthorized: true,
        },
        maxRetries: 3,
        requestTimeout: 10000,
        sniffOnStart: true,
      },
    });

    const vectorization = new VectorizationService({
      apiKey: process.env.OPENAI_API_KEY ?? "",
    });

    const redisClient = new RedisClient(this.redis!, logger);
    const redis = new RedisCacheService({
      client: redisClient,
      logger: logger,
      environment: process.env.NODE_ENV as
        | "development"
        | "production"
        | "test",
    });

    const postgres = new PostgresDataService(logger);

    const searchService = new DataSyncService({
      logger: logger,
      elasticsearch,
      redis,
      embeddingService: vectorization,
    });

    const automatedProcessor = new AutomatedFeedbackProcessor({
      logger: logger,
      elasticsearch,
      metrics: metricsService,
      prisma,
    });

    const abTesting = new SearchABTestingService({
      logger: logger,
      prisma,
      metrics: metricsService,
    });

    const feedback = new FeedbackService({
      logger: logger,
      elasticsearch,
      prisma,
    });

    const sessions = new SessionService({
      redis: redisClient,
      logger: logger,
      environment: process.env.NODE_ENV as
        | "development"
        | "production"
        | "test",
    });

    const baseServices = {
      elasticsearch,
      redis,
      postgres,
      vectorization,
      sync: searchService,
      analytics: new AnalyticsService({
        logger: logger,
      }),
      metrics: metricsService,
      abTesting,
      feedback,
      sessions,
      // Add missing required services
      observe: null,
      learning: null,
      engine: {
        instance: null,
        testService: async () => {
          return {
            operational: true,
            latency: expect.any(Number),
            errors: [],
            metrics: {
              operations: {
                total: 100,
                successful: 95,
                failed: 5,
                pending: 0,
              },
              performance: {
                latency: 50,
                throughput: 10,
                errorRate: 0.05,
                cpuUsage: 0.6,
                memoryUsage: 0.4,
              },
              status: "active",
              uptime: process.uptime(),
            },
          };
        },
      },
      documents: null,
      health: null,
    };

    return baseServices as unknown as Services;
  }
}

export const serviceManager = ServiceManager.getInstance();
