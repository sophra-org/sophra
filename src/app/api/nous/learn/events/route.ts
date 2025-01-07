import { LearningEventType } from "@/lib/nous/types/learning";
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { LearningEvent } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const querySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("100"),
  type: z.nativeEnum(LearningEventType).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    logger.info("Prisma client state:", {
      isPrismaAvailable: !!prisma,
      hasLearningEvent: !!(prisma && prisma.learningEvent),
    });

    try {
      logger.info("Testing DB connection...");
      await prisma.$queryRaw`SELECT 1`;
      logger.info("DB connection successful");
    } catch (e) {
      logger.error("DB connection failed:", e);
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 503 }
      );
    }

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
        },
        { status: 400 }
      );
    }

    const { limit, type, startDate, endDate } = validation.data;

    const events = await prisma.$queryRaw`
      SELECT * FROM "LearningEvent" 
      WHERE type::text = ${type || "SEARCH_PATTERN"}
      AND timestamp >= ${startDate ? new Date(startDate) : new Date(0)}
      AND timestamp <= ${endDate ? new Date(endDate) : new Date()}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    if (!events) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          timestamp: new Date().toISOString(),
          limit,
        },
      });
    }
    logger.info("Retrieved learning events", {
      count: Array.isArray(events) ? events.length : 0,
      type,
      limit,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: Array.isArray(events)
        ? events.map((event: LearningEvent) => ({
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            metadata: event.metadata,
            correlationId: event.correlationId,
            sessionId: event.sessionId,
            userId: event.userId,
            clientId: event.clientId,
            environment: event.environment,
            version: event.version,
            status: event.status,
            priority: event.priority,
            retryCount: event.retryCount,
          }))
        : [],
      meta: {
        total: Array.isArray(events) ? events.length : 0,
        timestamp: new Date().toISOString(),
        limit,
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve learning events", {
      error,
      errorType: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: true,
        data: [],
        error: "Failed to retrieve learning events",
        meta: {
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : typeof error,
          total: 0,
          limit: parseInt(
            new URL(req.url).searchParams.get("limit") || "100",
            10
          ),
        },
      },
      { status: 200 }
    );
  }
}
