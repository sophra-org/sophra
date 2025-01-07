import type { BaseServiceConfig } from "@/lib/cortex/core/services";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { CustomError } from "@/lib/cortex/utils/errors";
import { prisma } from "@/lib/shared/database/client";
import type { Logger } from "@/lib/shared/types";

/**
 * Configuration for PostgreSQL services
 */
export interface PostgresServiceConfig extends BaseServiceConfig {
  metrics?: MetricsService;
}

/**
 * Base class for all services
 */
abstract class BaseService {
  abstract initialize(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
}

/**
 * PostgreSQL Data Service
 */
export interface PostgresDataService {
  upsertRecord(
    table: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void>;
  deleteRecord(table: string, id: string): Promise<void>;
  // ... existing methods
}

export interface PostgresHealth {
  operational: boolean;
  latency: number;
  errors: string[];
  metrics: {
    connections: {
      active: number;
      idle: number;
      max: number;
    };
    performance: {
      queryLatency: number;
      transactionsPerSecond: number;
      cacheHitRatio: number;
    };
    storage: {
      databaseSize: string;
      tableCount: number;
    };
  };
}

export class PostgresDataService extends BaseService {
  protected logger: Logger;
  protected metrics?: MetricsService;
  private isInitialized = false;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await prisma.$connect();
      this.isInitialized = true;
      this.logger.info("PostgreSQL connection initialized");
    } catch (error) {
      this.logger.error("Failed to initialize PostgreSQL connection", {
        error,
      });
      throw new CustomError("DB_INITIALIZATION_FAILED", error as Error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error("Health check failed", { error });
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await prisma.$disconnect();
      this.isInitialized = false;
    }
  }

  public async testService(): Promise<PostgresHealth> {
    const start = Date.now();
    const errors: string[] = [];

    try {
      const dbStats = (await prisma.$queryRaw`
        SELECT 
          pg_database_size(current_database()) as db_size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT sum(xact_commit + xact_rollback)::float / 
            NULLIF(EXTRACT(EPOCH FROM current_timestamp - pg_postmaster_start_time())::float, 0)
           FROM pg_stat_database WHERE datname = current_database()) as transactions_per_second,
          (SELECT sum(blks_hit)::float / NULLIF(sum(blks_hit + blks_read)::float, 0) * 100 
           FROM pg_stat_database WHERE datname = current_database()) as cache_hit_ratio
      `) as any[];

      const stats = dbStats[0];

      return {
        operational: true,
        latency: Date.now() - start,
        errors,
        metrics: {
          connections: {
            active: Number(stats.active_connections || 0),
            idle: Number(stats.idle_connections || 0),
            max: Number(stats.max_connections || 0),
          },
          performance: {
            queryLatency: Date.now() - start,
            transactionsPerSecond: Number(stats.transactions_per_second || 0),
            cacheHitRatio: Number(stats.cache_hit_ratio || 0),
          },
          storage: {
            databaseSize: this.formatBytes(Number(stats.db_size || 0)),
            tableCount: Number(stats.table_count || 0),
          },
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      errors.push(err.message);

      return {
        operational: false,
        latency: Date.now() - start,
        errors,
        metrics: {
          connections: {
            active: 0,
            idle: 0,
            max: 0,
          },
          performance: {
            queryLatency: 0,
            transactionsPerSecond: 0,
            cacheHitRatio: 0,
          },
          storage: {
            databaseSize: "0B",
            tableCount: 0,
          },
        },
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}
