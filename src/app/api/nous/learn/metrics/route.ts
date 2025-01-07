import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
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
  metrics: z.string().refine(
    (s) => {
      const metrics = s.split(",").map((m) => m.toUpperCase());
      return metrics.every((m) =>
        VALID_METRICS.includes(m as (typeof VALID_METRICS)[number])
      );
    },
    {
      message: `Invalid metrics. Must be one of: ${VALID_METRICS.join(", ")}`,
    }
  ).transform((s) => s.split(",").map((m) => m.toUpperCase()) as MetricType[]),
  timeframe: z.enum(VALID_TIMEFRAMES),
  interval: z.enum(VALID_INTERVALS),
  include_metadata: z
    .string()
    .optional()
    .transform((s) => s === "true"),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    logger.info("Prisma client state:", {
      isPrismaAvailable: !!prisma,
      hasLearningMetric: !!(prisma && prisma.learningMetric),
    });

    try {
      logger.info("Testing DB connection...");
      await prisma.$queryRaw`SELECT 1`;
      logger.info("DB connection successful");
    } catch (e) {
      logger.error("DB connection failed:", e);
      throw e;
    }

    const { searchParams } = new URL(req.url);
    const validation = MetricsRequestSchema.safeParse({
      metrics: searchParams.get("metrics") || "",
      timeframe: searchParams.get("timeframe"),
      interval: searchParams.get("interval"),
      include_metadata: searchParams.get("include_metadata"),
    });

    if (!validation.success) {
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          generated_at: new Date().toISOString(),
          timeframe: null,
          interval: null,
          metrics_requested: [],
          count: 0,
          error: validation.error.message,
          took: Date.now() - startTime,
        },
      });
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

    const results = await prisma.$queryRaw`
      SELECT * FROM "LearningMetric" 
      WHERE type::text = ANY(${metrics}::text[])
      AND timestamp >= ${startDate}
      AND timestamp <= ${now}
      AND interval = ${interval}
      ORDER BY timestamp ASC
    `;

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data: results || [],
      metadata: {
        generated_at: new Date().toISOString(),
        timeframe,
        interval,
        metrics_requested: metrics,
        count: Array.isArray(results) ? results.length : 0,
        took: latency,
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const { searchParams } = new URL(req.url);
    const validation = MetricsRequestSchema.safeParse({
      metrics: searchParams.get("metrics") || "",
      timeframe: searchParams.get("timeframe"),
      interval: searchParams.get("interval"),
      include_metadata: searchParams.get("include_metadata"),
    });

    logger.error("Failed to fetch metrics", {
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json({
      success: true,
      data: [],
      metadata: {
        generated_at: new Date().toISOString(),
        timeframe: validation.success ? validation.data.timeframe : null,
        interval: validation.success ? validation.data.interval : null,
        metrics_requested: validation.success ? validation.data.metrics : [],
        count: 0,
        error: error instanceof Error ? error.message : String(error),
        took: latency,
      },
    });
  }
}
