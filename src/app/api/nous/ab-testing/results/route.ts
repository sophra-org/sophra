import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
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

    // Verify variant exists in experiment configuration
    const config = experiment.configuration as { variants: Array<{ id: string }> };
    const variantExists = config.variants.some(v => v.id === variantId);

    if (!variantExists) {
      logger.error("Invalid variant for experiment", {
        testId,
        variantId,
        availableVariants: config.variants.map(v => v.id)
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant",
          details: `Variant ${variantId} not found in experiment configuration`,
          availableVariants: config.variants.map(v => v.id)
        },
        { status: 400 }
      );
    }

    // Get services for Redis access
    const services = await serviceManager.getServices();
    
    if (!services.sessions || !services.redis) {
      logger.error("Required services not available", {
        sessionsAvailable: !!services.sessions,
        redisAvailable: !!services.redis
      });
      throw new Error("Required services not available");
    }

    // First check database for session
    let session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    // If not in database, try Redis
    if (!session) {
      const redisSession = await services.sessions.getSession(sessionId);
      
      if (!redisSession) {
        logger.error("Session not found in Redis or database", {
          sessionId,
          testId,
          variantId
        });
        return NextResponse.json(
          {
            success: false,
            error: "Invalid session",
            details: "Session not found",
            sessionId
          },
          { status: 404 }
        );
      }

      // Create session in database from Redis data
      try {
        // Set expiration to 30 days from now by default
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        session = await prisma.session.create({
          data: {
            id: sessionId,
            startedAt: new Date(redisSession.startedAt || new Date()),
            lastActiveAt: new Date(redisSession.lastActiveAt || new Date()),
            metadata: redisSession.metadata || {},
            userId: redisSession.userId || null,
            expiresAt: expiresAt,
            data: redisSession.data || {}
          }
        });
        logger.debug("Created session in database from Redis data", {
          sessionId
        });
      } catch (createError) {
        logger.error("Failed to create session in database", {
          error: createError,
          sessionId
        });
        throw new Error("Failed to create session in database");
      }
    }

    // Record metrics
    const metricsData = Object.entries(metrics).map(([key, value]) => ({
      testId,
      variantId,
      sessionId,
      eventType: key,
      value,
      timestamp: new Date()
    }));

    // Log the metrics being created
    logger.debug("Creating metrics", {
      testId,
      variantId,
      sessionId,
      metrics: metricsData
    });

    // Create metrics one by one to better handle errors
    const results = await Promise.all(
      metricsData.map(async (metric) => {
        try {
          return await prisma.aBTestMetric.create({
            data: metric
          });
        } catch (error) {
          logger.error("Failed to create metric", {
            error,
            metric
          });
          throw error;
        }
      })
    );

    const latency = Date.now() - startTime;
    logger.info("Recorded experiment metrics", {
      testId,
      variantId,
      metricCount: results.length,
      latency,
    });

    return NextResponse.json({
      success: true,
      data: {
        testId,
        variantId,
        metricsRecorded: results.length,
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
