import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import JSON5 from "json5";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignalType, EngagementType } from "./types";

// Declare Node.js runtime
export const runtime = "nodejs";

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
): "clicked" | "viewed" | "impressed" | "converted" {
  switch (action) {
    case SignalType.USER_BEHAVIOR_CLICK:
      return "clicked";
    case SignalType.USER_BEHAVIOR_VIEW:
      return "viewed";
    case SignalType.USER_BEHAVIOR_IMPRESSION:
      return "impressed";
    case SignalType.USER_BEHAVIOR_CONVERSION:
      return "converted";
    default:
      logger.warn("Unknown user action type, defaulting to impressed", {
        action,
        timestamp: new Date().toISOString()
      });
      return "impressed";
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
      // First, ensure session exists in database since we need it for relations
      const dbSession = await prisma.session.findUnique({
        where: {
          id: validation.data.sessionId,
        },
      });

      if (!dbSession) {
        // If not in database, try to get from Redis and create in database
        const redisSession = await services.sessions.getSession(validation.data.sessionId);
        
        if (!redisSession) {
          logger.error("Session not found in Redis or database", {
            sessionId: validation.data.sessionId,
            timestamp: new Date().toISOString(),
            redisAvailable: !!services.redis,
            sessionsAvailable: !!services.sessions
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

        // Create session in database from Redis data
        try {
          // Set expiration to 30 days from now by default
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);

          await prisma.session.create({
            data: {
              id: validation.data.sessionId,
              startedAt: new Date(redisSession.startedAt || new Date()),
              lastActiveAt: new Date(redisSession.lastActiveAt || new Date()),
              metadata: redisSession.metadata || {},
              userId: redisSession.userId || null,
              expiresAt: expiresAt,
              data: redisSession.data || {}
            }
          });
          logger.debug("Created session in database from Redis data", {
            sessionId: validation.data.sessionId
          });
        } catch (createError) {
          logger.error("Failed to create session in database", {
            error: createError,
            sessionId: validation.data.sessionId
          });
          throw new Error("Failed to create session in database");
        }
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
      // Process all feedback items
      for (const item of feedback) {
        const feedbackData = {
          searchId: item.queryId,
          queryHash: item.metadata.queryHash,
          resultId: item.metadata.resultId,
          relevanceScore: item.rating, // Rating is already between 0 and 1
          userAction: mapToCortexUserAction(item.metadata.userAction),
          metadata: {
            testId: item.metadata.customMetadata?.testId,
            variantId: item.metadata.customMetadata?.variantId,
            timestamp: item.metadata.timestamp,
            engagementType: item.metadata.engagementType,
            originalRating: item.rating,
            customData: item.metadata.customMetadata
          },
        };

        logger.debug("Processing feedback item", {
          feedbackData,
          userAction: item.metadata.userAction,
          mappedAction: mapToCortexUserAction(item.metadata.userAction),
          searchEventId: searchEvent.id
        });

        try {
          await services.feedback.recordFeedbackWithOptimization(feedbackData);
        } catch (itemError) {
          logger.error("Failed to process individual feedback item", {
            error: itemError,
            feedbackData,
            searchEventId: searchEvent.id
          });
          throw itemError;
        }
      }

      logger.info("Successfully processed all feedback items", {
        feedbackCount: feedback.length,
        searchEventId: searchEvent.id,
        firstItemAction: feedback[0]?.metadata.userAction,
        firstItemMappedAction: feedback[0] ? mapToCortexUserAction(feedback[0].metadata.userAction) : null
      });
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
