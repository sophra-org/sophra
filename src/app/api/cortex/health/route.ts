import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


const SERVICE_TIMEOUT = 15000;

const formatBytes = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)}${units[unitIndex]}`;
};

// First, let's separate the service-specific types
interface ElasticsearchMetrics {
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
    maxTaskWaitTime: string;
  };
  indices: {
    total: number;
    healthy: number;
    unhealthy: number;
    size: string;
    documentCount: number;
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
}

interface PostgresMetrics {
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
}

interface RedisMetrics {
  memory: {
    used: string;
    peak: string;
    fragmentationRatio: number;
  };
  hits: {
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: number;
  };
  performance: {
    connectedClients: number;
    blockedClients: number;
    opsPerSecond: number;
  };
}

interface ServiceMetrics {
  elasticsearch: {
    operational: boolean;
    latency: number;
    errors: string[];
    metrics: ElasticsearchMetrics;
  };
  postgres: {
    operational: boolean;
    latency: number;
    errors: string[];
    metrics: PostgresMetrics;
  };
  redis: {
    operational: boolean;
    latency: number;
    errors: string[];
    metrics: RedisMetrics;
  };
}

// Add the withTimeout helper function
const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  service: string
): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${service} check timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeout]);
};

// Update the checkService function to better handle errors
const checkService = async <T extends keyof ServiceMetrics>(
  service: T,
  serviceInstance: any,
  defaultMetrics: ServiceMetrics[T]["metrics"]
): Promise<ServiceMetrics[T]> => {
  const start = Date.now();
  try {
    if (!serviceInstance) {
      return {
        operational: false,
        latency: 0,
        errors: [`${service} service not available`],
        metrics: defaultMetrics,
      } as ServiceMetrics[T];
    }

    const health = await withTimeout(
      serviceInstance.testService?.() ?? Promise.resolve(false),
      SERVICE_TIMEOUT,
      service
    );
    return {
      operational:
        typeof health === "object" && health !== null && "operational" in health
          ? health.operational
          : false,
      latency: Date.now() - start,
      errors:
        typeof health === "object" && health !== null && "errors" in health
          ? health.errors
          : [],
      metrics:
        typeof health === "object" && health !== null && "metrics" in health
          ? health.metrics
          : defaultMetrics,
    } as ServiceMetrics[T];
  } catch (error) {
    return {
      operational: false,
      latency: Date.now() - start,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      metrics: defaultMetrics,
    } as ServiceMetrics[T];
  }
};

interface HealthCheckResponse {
  operational: boolean;
  errors: string[];
  metrics: Record<string, any>;
  latency?: number;
}

// First check basic connectivity
async function checkBasicConnectivity() {
  return await serviceManager.checkConnections();
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    logger.info("Starting health check...");

    // First check basic connectivity
    const connections = await checkBasicConnectivity();

    // Only proceed with detailed checks if basic connectivity is good
    if (Object.values(connections).every(Boolean)) {
      const services = await serviceManager.getServices();

      const health = {
        timestamp: new Date().toISOString(),
        services: {
          elasticsearch: await checkService(
            "elasticsearch",
            services.elasticsearch,
            {
              cluster: {
                status: "unknown",
                name: "unknown",
                nodes: 0,
                dataNodes: 0,
                activePrimaryShards: 0,
                activeShards: 0,
                relocatingShards: 0,
                initializingShards: 0,
                unassignedShards: 0,
                pendingTasks: 0,
                maxTaskWaitTime: "0ms",
              },
              indices: {
                total: 0,
                healthy: 0,
                unhealthy: 0,
                size: "0b",
                documentCount: 0,
              },
              performance: {
                queryLatency: 0,
                indexingLatency: 0,
                searchRate: 0,
                indexingRate: 0,
                cpuUsage: 0,
                memoryUsage: "0b",
                diskUsage: "0b",
              },
            }
          ),
          postgres: await checkService("postgres", services.postgres, {
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
              databaseSize: "0b",
              tableCount: 0,
            },
          }),
          redis: await checkService("redis", services.redis, {
            memory: {
              used: "0b",
              peak: "0b",
              fragmentationRatio: 0,
            },
            hits: {
              keyspaceHits: 0,
              keyspaceMisses: 0,
              hitRate: 0,
            },
            performance: {
              connectedClients: 0,
              blockedClients: 0,
              opsPerSecond: 0,
            },
          }),
        },
        overall: true,
      };

      return NextResponse.json({
        success: true,
        data: health,
        meta: {
          took: Date.now() - startTime,
        },
      });
    } else {
      // Return basic connectivity status if any connection failed
      return NextResponse.json(
        {
          success: false,
          data: {
            timestamp: new Date().toISOString(),
            services: {
              elasticsearch: { connected: connections.elasticsearch },
              postgres: { connected: connections.postgres },
              redis: { connected: connections.redis },
            },
            overall: false,
          },
          meta: {
            took: Date.now() - startTime,
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("Health check failed:", {
      error: errorMessage,
      stack: errorStack,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        meta: {
          took: Date.now() - startTime,
          stack: errorStack,
        },
      },
      { status: 500 }
    );
  }
}
