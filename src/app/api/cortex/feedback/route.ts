import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import JSON5 from "json5";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


enum SignalType {
  SEARCH = "SEARCH",
  PERFORMANCE = "PERFORMANCE",
  USER_BEHAVIOR_IMPRESSION = "USER_BEHAVIOR_IMPRESSION",
  USER_BEHAVIOR_VIEW = "USER_BEHAVIOR_VIEW",
  USER_BEHAVIOR_CLICK = "USER_BEHAVIOR_CLICK",
  USER_BEHAVIOR_CONVERSION = "USER_BEHAVIOR_CONVERSION",
  MODEL_PERFORMANCE = "MODEL_PERFORMANCE",
  FEEDBACK = "FEEDBACK",
  SYSTEM_HEALTH = "SYSTEM_HEALTH",
}

enum EngagementType {
  IMPRESSION = "IMPRESSION",
  VIEW = "VIEW",
  CLICK = "CLICK",
  CONVERSION = "CONVERSION",
}

const FeedbackSchema = z.object({
  sessionId: z.string(),
  feedback: z.array(
    z.object({
      queryId: z.string(),
      rating: z.number().min(0).max(1),
      metadata: z.object({
        userAction: z.nativeEnum(SignalType),
        resultId: z.string(),
        queryHash: z.string(),
        customMetadata: z.record(z.unknown()).optional(),
        timestamp: z.string().datetime(),
        engagementType: z.nativeEnum(EngagementType).optional(),
      }),
    })
  ),
});

function mapToCortexUserAction(
  action: SignalType
): "clicked" | "ignored" | "converted" {
  switch (action) {
    case SignalType.USER_BEHAVIOR_CLICK:
      return "clicked";
    case SignalType.USER_BEHAVIOR_CONVERSION:
      return "converted";
    default:
      return "ignored";
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "24h";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const timeframeMap: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(Date.now() - timeframeMap[timeframe]);

    const feedback = await prisma.feedbackRequest.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const latency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: feedback,
      metadata: {
        generated_at: new Date().toISOString(),
        timeframe,
        total_records: feedback.length,
        took: latency,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch feedback", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch feedback",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: { took: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody = null;
  let services = null;

  try {
    services = await serviceManager.getServices();

    if (!services.feedback) {
      logger.error("Feedback service not available");
      throw new Error("Feedback service not initialized");
    }

    rawBody = await req.text();
    const body = JSON5.parse(rawBody);
    const validation = FeedbackSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid feedback request", {
        errors: validation.error.format(),
        received: body,
        rawBody,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validation.error.format(),
          rawInput: rawBody,
        },
        { status: 400 }
      );
    }

    const { feedback } = validation.data;
    const timestamp = new Date().toISOString();

    // Create search event with error handling
    let searchEvent;
    try {
      // First, verify the session exists
      const session = await prisma.session.findUnique({
        where: {
          id: validation.data.sessionId,
        },
      });

      if (!session) {
        logger.error("Session not found", {
          sessionId: validation.data.sessionId,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          {
            success: false,
            error: "Invalid session",
            details: "Session not found",
            sessionId: validation.data.sessionId,
          },
          { status: 404 }
        );
      }

      searchEvent = await prisma.searchEvent.create({
        data: {
          timestamp: new Date(),
          filters: {},
          query: feedback[0].metadata.queryHash,
          searchType: "FEEDBACK",
          totalHits: 0,
          took: 0,
          session: {
            connect: {
              id: validation.data.sessionId,
            },
          },
        },
      });
    } catch (dbError) {
      logger.error("Failed to create search event", {
        error: dbError,
        sessionId: validation.data.sessionId,
        queryHash: feedback[0].metadata.queryHash,
        errorDetails:
          dbError instanceof Error
            ? {
                message: dbError.message,
                name: dbError.name,
                stack: dbError.stack,
              }
            : "Unknown error type",
        timestamp: new Date().toISOString(),
      });
      throw new Error(
        `Database operation failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`
      );
    }

    // Process feedback with error handling
    try {
      await services.feedback.recordFeedbackWithOptimization(
        feedback.map((item) => ({
          searchId: item.queryId,
          queryHash: item.metadata.queryHash,
          resultId: item.metadata.resultId,
          relevanceScore: Math.round(item.rating * 5),
          userAction: mapToCortexUserAction(item.metadata.userAction),
          metadata: {
            ...item.metadata.customMetadata,
            originalRating: item.rating,
            engagementType: item.metadata.engagementType,
            timestamp: item.metadata.timestamp,
          },
        }))[0]
      );
    } catch (feedbackError) {
      logger.error("Failed to process feedback", {
        error: feedbackError,
        searchEventId: searchEvent.id,
      });
      throw new Error("Feedback processing failed");
    }

    return NextResponse.json({
      success: true,
      data: {
        id: searchEvent.id,
        timestamp,
        feedbackCount: feedback.length,
        feedback: feedback.map((item) => ({
          queryId: item.queryId,
          rating: item.rating,
          action: item.metadata.userAction,
          timestamp: item.metadata.timestamp,
        })),
        metadata: {
          processedAt: timestamp.toString(),
          uniqueQueries: new Set(feedback.map((f) => f.queryId)).size,
          averageRating:
            feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length,
          actions: feedback.map((f) => f.metadata.userAction),
        },
      },
      meta: {
        took: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to record feedback", {
      error,
      rawBody,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      serviceStatus: {
        available: services?.feedback ? true : false,
        services: services ? Object.keys(services) : [],
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to record feedback",
        details: error instanceof Error ? error.message : "Unknown error",
        context: {
          rawBody,
          stack: error instanceof Error ? error.stack : undefined,
          serviceStatus: {
            available: services?.feedback ? true : false,
            services: services ? Object.keys(services) : [],
          },
        },
      },
      { status: 500 }
    );
  }
}
