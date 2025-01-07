import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const metrics = services.metrics;

    // Get all metrics
    const allMetrics = await metrics.getMetrics();

    if (!allMetrics) {
      throw new Error("No metrics data available");
    }

    // Log metrics for debugging
    logger.debug("Retrieved metrics", {
      metricsLength: allMetrics.length,
      availableMetrics: allMetrics
        .split("\n")
        .filter((line: string) => line.startsWith("sophra_")),
    });

    // Return raw Prometheus format
    return new NextResponse(allMetrics, {
      headers: {
        "Content-Type": "text/plain; version=0.0.4",
      },
    });
  } catch (error) {
    logger.error("Failed to get metrics", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Failed to get metrics" },
      { status: 500 }
    );
  }
}
