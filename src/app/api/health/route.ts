import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function GET(_req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logger.info("Starting basic health check...");
    const connections = await serviceManager.checkConnections();

    const health = {
      status: Object.values(connections).every(Boolean)
        ? "healthy"
        : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        elasticsearch: {
          connected: connections.elasticsearch,
          url: process.env.ELASTICSEARCH_URL,
        },
        postgres: {
          connected: connections.postgres,
          url: process.env.POSTGRESQL_URL?.split("@")[1], // Only show host info
        },
        redis: {
          connected: connections.redis,
          url: process.env.SOPHRA_REDIS_URL?.split("@")[1], // Only show host info
        },
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    const status = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(
      {
        success: health.status === "healthy",
        data: health,
        meta: { took: Date.now() - startTime },
      },
      { status }
    );
  } catch (error) {
    logger.error("Basic health check failed", { error });

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
