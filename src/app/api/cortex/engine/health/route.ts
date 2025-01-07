import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import type { Logger } from "@/lib/shared/types";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


const SERVICE_TIMEOUT = 5000;

async function checkService<T>(
  service: string,
  serviceInstance: any,
  defaultMetrics: T
): Promise<{
  operational: boolean;
  latency: number;
  errors: string[];
  metrics: T;
}> {
  const start = Date.now();
  const errors: string[] = [];

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`${service} check timed out`)),
        SERVICE_TIMEOUT
      );
    });

    const healthCheck = await Promise.race([
      serviceInstance?.testService?.(),
      timeoutPromise,
    ]);

    return {
      operational: healthCheck?.operational ?? false,
      latency: Date.now() - start,
      errors: healthCheck?.errors ?? [],
      metrics: healthCheck?.metrics ?? defaultMetrics,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error");
    return {
      operational: false,
      latency: Date.now() - start,
      errors,
      metrics: defaultMetrics,
    };
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const typedLogger = logger as unknown as Logger;
  typedLogger.service = "cortex-engine-health";
  const startTime = Date.now();

  try {
    logger.debug("Getting services...");
    const services = await serviceManager.getServices();
    logger.debug("Got services", { availableServices: Object.keys(services) });

    logger.debug("Starting engine health check...");
    const engineHealth = await checkService("engine", services.engine, {
      status: "unknown",
      uptime: 0,
      operations: {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        lastOperation: null,
      },
      performance: {
        latency: {
          p50: 0,
          p95: 0,
          p99: 0,
          average: 0,
        },
        throughput: {
          current: 0,
          average: 0,
          peak: 0,
        },
        errorRate: 0,
        successRate: 0,
      },
      resources: {
        cpu: {
          usage: 0,
          limit: 0,
        },
        memory: {
          used: 0,
          allocated: 0,
          peak: 0,
        },
        connections: {
          active: 0,
          idle: 0,
          max: 0,
        },
      },
      learning: {
        activeStrategies: 0,
        successfulOptimizations: 0,
        failedOptimizations: 0,
        lastOptimization: null,
      },
    });

    const health = {
      timestamp: new Date().toISOString(),
      engine: engineHealth,
      overall: engineHealth.operational,
    };

    logger.debug("Engine health check complete", {
      took: Date.now() - startTime,
      operational: health.overall,
      metrics: health.engine.metrics,
    });

    return NextResponse.json({
      success: true,
      data: health,
      meta: { took: Date.now() - startTime },
    });
  } catch (error) {
    logger.error("Engine health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      took: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        meta: { took: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}
