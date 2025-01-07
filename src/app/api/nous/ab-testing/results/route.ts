import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const ResultsSchema = z.object({
  testId: z.string(),
  variantId: z.string(),
  metrics: z.record(z.number()),
  sessionId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validation = ResultsSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid results submission", {
        errors: validation.error.format(),
        received: body,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { testId, variantId, metrics, sessionId, metadata } = validation.data;

    // Verify experiment exists and is active
    const experiment = await prisma.aBTest.findFirst({
      where: {
        id: testId,
        status: "ACTIVE",
      },
    });

    if (!experiment) {
      return NextResponse.json(
        {
          success: false,
          error: "Experiment not found or not active",
          details: `No active experiment found with ID: ${testId}`,
        },
        { status: 404 }
      );
    }

    // Record metrics
    const metricsData = Object.entries(metrics).map(([key, value]) => ({
      testId,
      variantId,
      sessionId,
      eventType: key,
      value,
      metadata: metadata ? metadata : null,
      timestamp: new Date(),
    }));
    const results = await prisma.aBTestMetric.createMany({
      data: metricsData.map((metric) => ({
        testId: metric.testId,
        variantId: metric.variantId,
        sessionId: metric.sessionId,
        eventType: metric.eventType,
        value: metric.value,
        timestamp: metric.timestamp,
        metadata:
          metric.metadata === null
            ? Prisma.JsonNull
            : (metric.metadata as Prisma.InputJsonValue),
      })),
    });

    const latency = Date.now() - startTime;
    logger.info("Recorded experiment metrics", {
      testId,
      variantId,
      metricCount: results.count,
      latency,
    });

    return NextResponse.json({
      success: true,
      data: {
        testId,
        variantId,
        metricsRecorded: results.count,
      },
      meta: {
        took: latency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to record metrics", {
      error,
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to record metrics",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: { took: latency },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const testId = url.searchParams.get("testId");

    if (!testId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing testId parameter",
        },
        { status: 400 }
      );
    }

    const metrics = await prisma.aBTestMetric.findMany({
      where: { testId },
      orderBy: { timestamp: "desc" },
    });

    const aggregatedMetrics = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.variantId]) {
          acc[metric.variantId] = {};
        }
        if (!acc[metric.variantId][metric.eventType]) {
          acc[metric.variantId][metric.eventType] = [];
        }
        acc[metric.variantId][metric.eventType].push(metric.value);
        return acc;
      },
      {} as Record<string, Record<string, number[]>>
    );

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data: {
        testId,
        metrics: aggregatedMetrics,
      },
      meta: {
        took: latency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to fetch metrics", { error });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: { took: latency },
      },
      { status: 500 }
    );
  }
}
