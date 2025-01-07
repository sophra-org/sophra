import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logger.info("Starting basic health check...");
    const services = await serviceManager.getServices();

    logger.info("Checking service connections...");
    const [esHealth, pgHealth, redisHealth] = await Promise.all([
      services.elasticsearch.ping().then((result) => {
        logger.info("Elasticsearch health check:", {
          status: result ? "connected" : "disconnected",
        });
        return result;
      }),
      services.postgres.ping().then((result) => {
        logger.info("PostgreSQL health check:", {
          status: result ? "connected" : "disconnected",
        });
        return result;
      }),
      services.redis.ping().then((result) => {
        logger.info("Redis health check:", {
          status: result ? "connected" : "disconnected",
        });
        return result;
      }),
    ]);

    const health = {
      status: esHealth && pgHealth && redisHealth ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        elasticsearch: {
          connected: esHealth,
          url: process.env.ELASTICSEARCH_URL,
        },
        postgres: {
          connected: pgHealth,
          url: process.env.POSTGRESQL_URL?.split("@")[1],
        },
        redis: {
          connected: redisHealth,
          url: process.env.SOPHRA_REDIS_URL?.split("@")[1],
        },
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    const status = health.status === "healthy" ? 200 : 503;

    logger.info(`Health check completed: ${health.status}`, {
      took: Date.now() - startTime,
      status,
    });

    return NextResponse.json(
      {
        success: health.status === "healthy",
        data: health,
        meta: { took: Date.now() - startTime },
      },
      { status }
    );
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      took: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
        meta: { took: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}
