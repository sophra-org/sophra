import { ElasticClient } from "@/lib/cortex/elasticsearch/client";
import { RedisClient } from "@/lib/cortex/redis/client";
import { CustomError } from "@/lib/cortex/utils/errors";
import { prisma } from "@/lib/shared/database/client";
import { logger } from "@/lib/shared/logger";
import type { Logger } from "@/lib/shared/types";
import Redis from "ioredis";

/**
 * 🎮 Configuration for Our Main Client
 *
 * The essential settings our client needs to know where and how to run.
 * Like setting up your game before you start playing! 🎲
 *
 * @interface SophraClientConfig
 * @property {string} environment - Where we're running: development, production, or test
 * @property {Logger} [logger] - Optional custom logger instance
 */
export interface SophraClientConfig {
  environment: "development" | "production" | "test";
  logger?: Logger;
}

/**
 * 🎯 The Main Sophra Client: Your Gateway to All Services!
 *
 * Think of this as your universal remote control - it helps you talk to all
 * our different services (databases, search, cache) in one place!
 *
 * What it helps with:
 * - 🔌 Connecting to all our services
 * - 🏥 Checking if everything's healthy
 * - 🔒 Managing connections safely
 * - 🧹 Cleaning up when we're done
 *
 * @class SophraClient
 *
 * @example
 * const client = new SophraClient({ environment: 'development' });
 * await client.initialize();
 * // Now you can use any service you need!
 * await client.healthCheck();
 * // Don't forget to clean up when done
 * await client.shutdown();
 */
export class SophraClient {
  private readonly logger: Logger;
  private readonly config: SophraClientConfig;
  private elasticClient?: ElasticClient;
  private redisClient?: RedisClient;

  /**
   * 🎒 Sets Up Your Universal Remote
   *
   * Creates a new client with all the settings it needs.
   * Like packing your backpack before an adventure!
   *
   * @param {SophraClientConfig} config - Your essential settings
   * @throws {CustomError} If any required settings are missing
   */
  constructor(config: SophraClientConfig) {
    this.logger = config.logger || logger.child({ name: "SophraClient" }) as Logger;
    this.config = this.validateConfig(config);
  }

  /**
   * 🔍 Makes Sure All Settings Are Valid
   *
   * Checks that we have everything we need before starting.
   * Like checking your packing list before a trip!
   *
   * @private
   * @param {SophraClientConfig} config - Settings to validate
   * @returns {SophraClientConfig} The validated settings
   * @throws {CustomError} If anything's missing or incorrect
   */
  private validateConfig(config: SophraClientConfig): SophraClientConfig {
    try {
      if (!process.env.ELASTICSEARCH_URL) {
        throw new Error("ELASTICSEARCH_URL environment variable is required");
      }
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is required");
      }
      if (!config.environment) {
        throw new Error("Environment is required");
      }

      // Validate Elasticsearch auth - support both key formats
      if (
        !process.env.ELASTICSEARCH_API_KEY &&
        !process.env.SOPHRA_ES_API_KEY
      ) {
        throw new Error(
          "Either ELASTICSEARCH_API_KEY or SOPHRA_ES_API_KEY is required"
        );
      }

      return config;
    } catch (error) {
      this.logger.error("Configuration validation failed", { error });
      throw new CustomError("INVALID_CONFIG", error as Error);
    }
  }

  /**
   * 🚀 Starts Up All Services
   *
   * Gets everything ready for action! Connects to databases,
   * sets up caching, and makes sure everything's talking to each other.
   *
   * @returns {Promise<void>} When everything's ready to go
   * @throws {CustomError} If something goes wrong during startup
   */
  async initialize(): Promise<void> {
    try {
      // Initialize database connection first
      await prisma.$connect();

      // Initialize Elasticsearch client
      this.elasticClient = new ElasticClient(this.logger);
      await this.elasticClient.ping();

      // Initialize Redis client if URL is provided
      if (process.env.SOPHRA_REDIS_URL) {
        this.redisClient = this.createRedisClient();
        await this.redisClient.ping();
      }

      this.logger.info('Sophra client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Sophra client', { error });
      // Ensure cleanup happens and database disconnects
      await prisma.$disconnect();
      if (this.elasticClient) {
        try {
          const client = this.elasticClient.getClient();
          await client.close();
        } catch (cleanupError) {
          this.logger.error('Failed to cleanup Elasticsearch client', { cleanupError });
        }
        this.elasticClient = undefined;
      }
      if (this.redisClient) {
        try {
          await this.redisClient.disconnect();
        } catch (cleanupError) {
          this.logger.error('Failed to cleanup Redis client', { cleanupError });
        }
        this.redisClient = undefined;
      }
      throw new Error('Initialization failed');
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.elasticClient) {
        const client = this.elasticClient.getClient();
        await client.close();
        this.elasticClient = undefined;
      }
      if (this.redisClient) {
        await this.redisClient.disconnect();
        this.redisClient = undefined;
      }
    } catch (error) {
      this.logger.error('Cleanup failed', { error });
      throw new Error('Cleanup failed');
    }
  }

  /**
   * 👋 Says Goodbye and Cleans Up
   *
   * Safely closes all connections and tidies up.
   * Always clean up after yourself! 🧹
   *
   * @returns {Promise<void>} When cleanup is complete
   * @throws {CustomError} If something goes wrong during shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.disconnect();
        this.redisClient = undefined;
      }
      if (this.elasticClient) {
        const client = this.elasticClient.getClient();
        await client.close();
        this.elasticClient = undefined;
      }
      await prisma.$disconnect();
      this.logger.info('Sophra client shutdown successfully');
    } catch (error) {
      this.logger.error('Failed to shutdown Sophra client', { error });
      throw error;
    }
  }

  /**
   * 🏥 Checks if Everything's Healthy
   *
   * Like a doctor's checkup for our services!
   * Makes sure everything's feeling good and working well.
   *
   * @returns {Promise<Record<string, boolean>>} Health status of each service
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {
      elasticsearch: false,
      database: false,
      redis: false,
    };

    // Check Elasticsearch health if initialized
    if (this.elasticClient) {
      try {
        const pingResult = await this.elasticClient.ping();
        health.elasticsearch = pingResult === true;
      } catch (error) {
        this.logger.error('Elasticsearch health check failed', { error });
        health.elasticsearch = false;
      }
    }

    // Check database health
    try {
      const result = await prisma.$queryRaw`SELECT 1`;
      health.database = Array.isArray(result) && result.length > 0 && result[0]['?column?'] === 1;
    } catch (error) {
      this.logger.error('Database health check failed', { error });
      health.database = false;
    }

    // Check Redis health if initialized
    if (this.redisClient) {
      try {
        const pingResult = await this.redisClient.ping();
        health.redis = pingResult === true;
      } catch (error) {
        this.logger.error('Redis health check failed', { error });
        health.redis = false;
      }
    }

    return health;
  }

  /**
   * 🔍 Gets the Search Service
   *
   * Hands you the Elasticsearch client for searching and indexing.
   *
   * @returns {ElasticClient} Your search helper
   * @throws {CustomError} If the service isn't ready yet
   */
  getElasticClient(): ElasticClient {
    if (!this.elasticClient) {
      this.logger.error('Attempted to get Elasticsearch client before initialization');
      throw new CustomError(
        "CLIENT_NOT_INITIALIZED",
        new Error("Elasticsearch client not initialized. Call initialize() first.")
      );
    }
    return this.elasticClient;
  }

  /**
   * 💾 Gets the Database Service
   *
   * Hands you the PostgreSQL client for data storage.
   *

  /**
   * ⚡ Gets the Cache Service
   *
   * Hands you the Redis client for fast data access.
   *
   * @returns {RedisClient} Your speed booster
   * @throws {CustomError} If the service isn't ready yet
   */
  getRedisClient(): RedisClient {
    if (!this.redisClient) {
      throw new CustomError(
        "CLIENT_NOT_INITIALIZED",
        new Error("Redis client not initialized")
      );
    }
    return this.redisClient;
  }

  /**
   * 🏗️ Creates a New Database Connection
   *
   * Sets up a fresh connection to PostgreSQL with all the right settings.
   *
   * @private
   * @returns {PostgresClient} A configured database client
   * @throws {Error} If connection settings are missing
   */
  /**
   * Creates a New Cache Connection
   *
   * Sets up a fresh connection to Redis for speedy data access.
   *
   * @private
   * @returns {RedisClient} A configured cache client
   * @throws {Error} If Redis URL is missing
   */
  private createRedisClient(): RedisClient {
    const redisUrl = process.env.SOPHRA_REDIS_URL;
    if (!redisUrl) {
      throw new Error("SOPHRA_REDIS_URL is required");
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    return new RedisClient(redis, this.logger);
  }
}
