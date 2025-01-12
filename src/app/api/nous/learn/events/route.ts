import { prisma } from "@/lib/shared/database/client";
import { LearningEventType, LearningEventStatus, LearningEventPriority } from "@prisma/client";
import logger from "@/lib/shared/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const querySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a valid number")
    .transform((val) => parseInt(val, 10))
    .default("100"),
  type: z.nativeEnum(LearningEventType).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createEventSchema = z.object({
  type: z.nativeEnum(LearningEventType),
  priority: z.nativeEnum(LearningEventPriority).default("MEDIUM"),
  metadata: z.record(z.unknown()),
  correlationId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    logger.debug("Starting learning events query", {
      url: req.url,
      timestamp: new Date().toISOString()
    });

    // Validate database connection
    try {
      await prisma.$connect();
      logger.debug("Database connection successful");
    } catch (e) {
      logger.error("Database connection failed:", e);
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          meta: {
            timestamp: new Date().toISOString(),
            errorDetails: e instanceof Error ? e.message : String(e)
          },
        },
        { status: 503 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const validation = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      logger.error("Invalid query parameters", {
        errors: validation.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.format(),
          meta: {
            timestamp: new Date().toISOString(),
            details: validation.error.format()
          }
        },
        { status: 400 }
      );
    }

    const { limit, type, startDate, endDate } = validation.data;

    // Build query conditions
    const where = {
      timestamp: {
        gte: startDate ? new Date(startDate) : new Date(0),
        lte: endDate ? new Date(endDate) : new Date()
      }
    };

    // Only add type filter if specified
    if (type) {
      logger.debug("Adding type filter", { type });
      where.type = type;
    }

    // Log available types
    logger.debug("Available event types", {
      types: Object.values(LearningEventType)
    });

    logger.debug("Querying learning events with params", {
      where,
      limit,
      timestamp: new Date().toISOString()
    });

    // Get total count for pagination
    const totalCount = await prisma.learningEvent.count({ where });

    // Query events with conditions
    const events = await prisma.learningEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        patterns: true // Include related patterns if needed
      }
    });

    logger.info("Retrieved learning events", {
      count: events.length,
      total: totalCount,
      type,
      limit,
      startDate,
      endDate,
    });

    // Format response
    const formattedEvents = events.map((event) => ({
      id: event.id,
      type: event.type,
      priority: event.priority,
      timestamp: event.timestamp,
      processedAt: event.processedAt,
      metadata: event.metadata,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      status: event.status,
      correlationId: event.correlationId,
      sessionId: event.sessionId,
      userId: event.userId,
      clientId: event.clientId,
      environment: event.environment,
      version: event.version,
      tags: event.tags,
      error: event.error,
      retryCount: event.retryCount,
      patterns: event.patterns
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents,
      meta: {
        total: totalCount,
        returned: events.length,
        timestamp: new Date().toISOString(),
        limit,
        query: {
          type,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined
        }
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve learning events", {
      error,
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve learning events",
        meta: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          total: 0,
          limit: parseInt(
            new URL(req.url).searchParams.get("limit") || "100",
            10
          ),
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid event data", {
        errors: validation.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event data",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const eventData = validation.data;

    logger.debug("Creating learning event", {
      type: eventData.type,
      priority: eventData.priority,
      timestamp: new Date().toISOString()
    });

    const event = await prisma.learningEvent.create({
      data: {
        ...eventData,
        status: LearningEventStatus.PENDING,
        timestamp: new Date(),
        retryCount: 0
      },
      include: {
        patterns: true
      }
    });

    logger.info("Created learning event", {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp
    });

    return NextResponse.json({
      success: true,
      data: event,
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    logger.error("Failed to create learning event", {
      error,
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create learning event",
        meta: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
}
