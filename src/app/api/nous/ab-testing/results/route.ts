import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import type { Services } from "@/lib/cortex/types/services";
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

    logger.debug("Found experiment", {
      testId,
      experimentFound: !!experiment,
      experimentDetails: experiment
        ? {
            id: experiment.id,
            name: experiment.name,
            status: experiment.status,
            hasConfiguration: !!experiment.configuration,
          }
        : null,
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

    // Parse and validate configuration to check if variant exists
    let config: { variants: Array<{ id: string }> };
    logger.debug("Parsing experiment configuration", {
      testId,
      configType: typeof experiment.configuration,
      rawConfig: experiment.configuration,
      configString: JSON.stringify(experiment.configuration, null, 2),
    });

    try {
      // Configuration is stored as a string in the database
      const parsedConfig = JSON.parse(experiment.configuration as string);

      logger.debug("Parsed configuration", {
        testId,
        hasVariants: !!parsedConfig?.variants,
        variantsType: parsedConfig?.variants
          ? typeof parsedConfig.variants
          : "undefined",
        isArray: Array.isArray(parsedConfig?.variants),
        variants: parsedConfig?.variants,
      });

      if (!parsedConfig?.variants || !Array.isArray(parsedConfig.variants)) {
        throw new Error("Invalid configuration structure");
      }

      // Map the configuration to our expected structure
      config = {
        variants: parsedConfig.variants.map((v: { id: string }) => ({
          id: v.id,
          // Other fields are not needed for validation
        })),
      };

      logger.debug("Validated configuration", {
        testId,
        variantCount: config.variants.length,
        variantIds: config.variants.map((v) => v.id),
      });
    } catch (error) {
      logger.error("Failed to parse experiment configuration", {
        testId,
        error,
        configuration: experiment.configuration,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid experiment configuration",
          details: "Failed to parse experiment configuration",
        },
        { status: 400 }
      );
    }

    // Check if variant exists in configuration
    const variantExists = config.variants.some((v) => v.id === variantId);
    if (!variantExists) {
      logger.error("Invalid variant", {
        testId,
        variantId,
        availableVariants: config.variants.map((v) => v.id),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant",
          details: `Variant ${variantId} not found in experiment configuration`,
          availableVariants: config.variants.map((v) => v.id),
        },
        { status: 400 }
      );
    }

    // Get services for Redis access
    const services: Services = await serviceManager.getServices();

    if (!services.sessions || !services.redis) {
      logger.error("Required services not available", {
        sessionsAvailable: !!services.sessions,
        redisAvailable: !!services.redis,
      });
      throw new Error("Required services not available");
    }

    // First check database for session
    let session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    // If not in database, try Redis
    if (!session) {
      const redisSession = await services.sessions.getSession(sessionId);

      if (!redisSession) {
        logger.error("Session not found in Redis or database", {
          sessionId,
          testId,
          variantId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Invalid session",
            details: "Session not found",
            sessionId,
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
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: redisSession?.metadata || {},
            userId: redisSession?.userId || null,
            expiresAt: expiresAt,
          },
        });
        logger.debug("Created session in database from Redis data", {
          sessionId,
        });
      } catch (createError) {
        logger.error("Failed to create session in database", {
          error: createError,
          sessionId,
        });
        throw new Error("Failed to create session in database");
      }
    }

    // Check if session already has an assignment
    const existingAssignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_sessionId: {
          testId,
          sessionId,
        },
      },
    });

    if (existingAssignment) {
      if (existingAssignment.variantId !== variantId) {
        logger.error("Session already assigned to different variant", {
          testId,
          sessionId,
          requestedVariant: variantId,
          assignedVariant: existingAssignment.variantId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Invalid variant assignment",
            details: `Session ${sessionId} is already assigned to variant ${existingAssignment.variantId}`,
          },
          { status: 400 }
        );
      }
      logger.debug("Using existing assignment", {
        testId,
        sessionId,
        variantId,
      });
    } else {
      // Create new assignment
      try {
        await prisma.aBTestAssignment.create({
          data: {
            testId,
            sessionId,
            variantId,
            timestamp: new Date(),
          },
        });
        logger.debug("Created variant assignment", {
          testId,
          sessionId,
          variantId,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          // Race condition - assignment was created between our check and create
          logger.debug("Assignment created by concurrent request", {
            testId,
            sessionId,
            variantId,
          });
        } else {
          throw error;
        }
      }
    }

    // Record metrics
    const metricsData = Object.entries(metrics).map(([key, value]) => ({
      testId,
      variantId,
      sessionId,
      eventType: key,
      value,
      timestamp: new Date(),
    }));

    // Log the metrics being created
    logger.debug("Creating metrics", {
      testId,
      variantId,
      sessionId,
      metrics: metricsData,
    });

    // Create metrics one by one to better handle errors
    const results = await Promise.all(
      metricsData.map(async (metric) => {
        try {
          return await prisma.aBTestMetric.create({
            data: metric,
          });
        } catch (error) {
          logger.error("Failed to create metric", {
            error,
            metric,
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
