import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { MetricType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const VALID_TIMEFRAMES = ["1h", "24h", "7d", "30d"] as const;
const VALID_INTERVALS = ["1h", "1d"] as const;

// Define valid metric types based on the Prisma enum
const VALID_METRICS = [
  "FEEDBACK_SCORE",
  "ENGAGEMENT_RATE",
  "RELEVANCE_SCORE",
  "CLICK_THROUGH",
  "CONVERSION_RATE",
  "SEARCH_LATENCY",
  "MODEL_ACCURACY",
  "ADAPTATION_SUCCESS",
] as const;

const MetricsRequestSchema = z.object({
  metrics: z.string().optional(),
  timeframe: z.enum(VALID_TIMEFRAMES).optional(),
  interval: z.enum(VALID_INTERVALS).optional(),
  include_metadata: z.string().optional(),
}).transform(data => ({
  metrics: data.metrics?.split(",").map(m => m.toUpperCase()) as MetricType[] || VALID_METRICS,
  timeframe: data.timeframe || "24h",
  interval: data.interval || "1h",
  include_metadata: data.include_metadata === "true"
}));

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const validation = MetricsRequestSchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          details: validation.error.format(),
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          }
        },
        { status: 400 }
      );
    }

    const { metrics, timeframe, interval } = validation.data;

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date(now);
    switch (timeframe) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const results = await prisma.learningMetric.findMany({
      where: {
        type: { in: metrics },
        timestamp: {
          gte: startDate,
          lte: now,
        },
        interval,
      },
      orderBy: { timestamp: "asc" },
    });

    const formattedResults = results.map(metric => ({
      id: metric.id,
      type: metric.type,
      value: metric.value,
      timestamp: metric.timestamp,
      interval: metric.interval,
      timeframe: metric.timeframe,
      sessionId: metric.sessionId,
      modelId: metric.modelId,
      aggregated: metric.aggregated,
      metadata: metric.metadata,
      count: metric.count,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    }));

    return NextResponse.json({
      metrics: formattedResults,
      pagination: {
        page: 1,
        pageSize: 10,
        total: formattedResults.length,
        totalPages: Math.ceil(formattedResults.length / 10),
      }
    });
  } catch (error) {
    logger.error("Failed to fetch metrics", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : "Unknown error",
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        }
      },
      { status: 500 }
    );
  }
}
