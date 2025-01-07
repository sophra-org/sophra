import { serviceManager } from "@/lib/cortex/utils/service-manager";
import type { ElasticsearchHealth } from "@/lib/cortex/elasticsearch/services";
import { PostgresDataService } from "@/lib/cortex/postgres/services";
import type { Logger } from "@/lib/shared/types";

interface HealthCheckResponse {
  success: boolean;
  data: {
    timestamp: string;
    elasticsearch: boolean;
    postgres: boolean;
    redis: boolean;
    sync: boolean;
    stats: {
      elasticsearch: {
        indices: number;
        documents: number;
        size: string;
        health: string;
      };
      services: {
        elasticsearch: { latency: number; errors: string[] };
        postgres: { latency: number; errors: string[] };
        redis: { latency: number; errors: string[] };
      };
    };
  };
  error?: string;
}

export class APIService {
  private readonly logger: Logger;
  private readonly prisma: PostgresDataService;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger;
    this.prisma = new PostgresDataService(logger);
  }

  async healthCheck(): Promise<HealthCheckResponse> {
    const health = {
      timestamp: new Date().toISOString(),
      elasticsearch: false,
      postgres: false,
      redis: false,
      sync: false,
      stats: {
        elasticsearch: {
          indices: 0,
          documents: 0,
          size: "0b",
          health: "red",
        },
        services: {
          elasticsearch: { latency: 0, errors: [] as string[] },
          postgres: { latency: 0, errors: [] as string[] },
          redis: { latency: 0, errors: [] as string[] },
        },
      },
    };

    try {
      const services = await serviceManager.getServices();
      const [esHealth, pgHealth, redisHealth] = await Promise.all([
        services.elasticsearch.testService(),
        services.postgres.healthCheck(),
        services.redis.healthCheck(),
      ]) as unknown as [
        ElasticsearchHealth,
        ElasticsearchHealth,
        ElasticsearchHealth,
      ];

      health.elasticsearch = esHealth.operational;
      health.postgres = pgHealth.operational;
      health.redis = redisHealth.operational;
      health.sync = health.elasticsearch && health.postgres && health.redis;
      health.stats.services = {
        elasticsearch: {
          latency: esHealth.latency,
          errors: esHealth.errors,
        },
        postgres: {
          latency: pgHealth.latency,
          errors: pgHealth.errors,
        },
        redis: {
          latency: redisHealth.latency,
          errors: redisHealth.errors,
        },
      };

      return {
        success: true,
        data: health,
      };
    } catch (error) {
      this.logger.error("Health check failed:", { error });
      return {
        success: false,
        data: health,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  async shutdown(): Promise<void> {
    await this.prisma.disconnect();
  }
}
