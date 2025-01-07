import type { BaseServiceConfig } from "@/lib/cortex/core/services";
import type { DataSyncService } from "@/lib/cortex/core/sync-service";
import type { Logger } from "@/lib/shared/types";
import type { RedisClient } from "./client";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";

/**
 * ⚡ Redis Service Configuration: Setting Up Your Speed Booster!
 *
 * Everything needed to configure the Redis caching service.
 * Like setting up a super-fast memory assistant! 🚀
 *
 * @interface RedisServiceConfig
 * @extends BaseServiceConfig
 *
 * @property {RedisClient} client - Your Redis connection
 * @property {number} [defaultTTL] - How long to keep things by default
 * @property {DataSyncService} [searchService] - Helper for keeping cache fresh
 * @property {MetricsService} [metrics] - Service for tracking performance metrics
 */
export interface RedisServiceConfig extends BaseServiceConfig {
  /** Redis client instance */
  client: RedisClient;
  /** Default TTL in seconds */
  defaultTTL?: number;
  /** Search service for cache revalidation */
  searchService?: DataSyncService;
  /** Metrics service for tracking performance */
  metrics?: MetricsService;
  logger: Logger;
  environment: "development" | "production" | "test";
}

/**
 * 📋 Cache Strategy: Your Caching Rulebook
 *
 * Rules for how to handle different types of cached data.
 * Like having different rules for different types of memories! 🧠
 *
 * @interface CacheStrategy
 * @property {number} ttl - How long to remember
 * @property {number} priority - How important it is
 * @property {boolean} revalidate - Whether to check if it's still good
 */
export interface CacheStrategy {
  ttl: number;
  priority: number;
  revalidate: boolean;
}

/**
 * 📊 Query Pattern: Understanding Search Habits
 *
 * Tracks how people use different types of searches.
 * Like keeping notes on what people look for most! 🔍
 *
 * @interface QueryPattern
 * @property {number} frequency - How often it's used
 * @property {string} lastAccessed - When it was last used
 * @property {number} avgLatency - How fast it usually is
 * @property {number} hitRate - How often it's found in cache
 */
export interface QueryPattern {
  frequency: number;
  lastAccessed: string;
  avgLatency: number;
  hitRate: number;
}

export interface RedisHealth {
  operational: boolean;
  latency: number;
  errors: string[];
  metrics: {
    cluster: {
      status: string;
      name: string;
      nodes: number;
      dataNodes: number;
      activePrimaryShards: number;
      activeShards: number;
      relocatingShards: number;
      initializingShards: number;
      unassignedShards: number;
      pendingTasks: number;
    };
    performance: {
      queryLatency: number;
      indexingLatency: number;
      searchRate: number;
      indexingRate: number;
      cpuUsage: number;
      memoryUsage: string;
      diskUsage: string;
    };
  };
}
