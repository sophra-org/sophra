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
): "clicked" | "converted" | "ignored" {
  switch (action) {
    case SignalType.USER_BEHAVIOR_CLICK:
      return "clicked";
    case SignalType.USER_BEHAVIOR_CONVERSION:
      return "converted";
    case SignalType.USER_BEHAVIOR_VIEW:
    case SignalType.USER_BEHAVIOR_IMPRESSION:
    default:
      logger.warn("Unsupported user action type, defaulting to ignored", {
        action,
        timestamp: new Date().toISOString(),
      });
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

    // Create search event with error handling in a transaction
    let searchEvent;
    try {
      // Use a transaction to ensure session and search event creation are atomic
      const result = await prisma.$transaction(async (tx) => {
        // First, ensure session exists in database since we need it for relations
        const dbSession = await tx.session.findUnique({
          where: {
            id: validation.data.sessionId,
          },
        });

        if (!dbSession) {
          // If not in database, try to get from Redis and create in database
          const redisSession = await services.sessions.getSession(
            validation.data.sessionId
          );

          if (!redisSession) {
            logger.error("Session not found in Redis or database", {
              sessionId: validation.data.sessionId,
              timestamp: new Date().toISOString(),
              redisAvailable: !!services.redis,
              sessionsAvailable: !!services.sessions,
            });
            throw new Error("Session not found in Redis or database");
          }

          // Set expiration to 30 days from now by default
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          const now = new Date();

          // Create session
          await tx.session.create({
            data: {
              id: validation.data.sessionId,
              startedAt: now,
              lastActiveAt: now,
              createdAt: now,
              updatedAt: now,
              metadata: redisSession?.metadata || {},
              userId: redisSession?.userId || null,
              expiresAt: expiresAt,
              data: redisSession?.data || {}
            },
          });
        }

        // Create search event
        const event = await tx.searchEvent.create({
          data: {
            timestamp: new Date(),
            filters: {} as JsonValue,
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

        return event;
      });

      searchEvent = result;
      logger.debug("Created search event", {
        searchEventId: searchEvent.id,
        sessionId: validation.data.sessionId,
        queryHash: feedback[0].metadata.queryHash,
        filters: searchEvent.filters
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
      // Process all feedback items with error tracking
      const feedbackResults = [];
      for (const item of feedback) {
        logger.debug("Preparing feedback data", {
          searchEventId: searchEvent.id,
          itemQueryId: item.queryId,
          itemQueryHash: item.metadata.queryHash,
          itemAction: item.metadata.userAction,
          mappedAction: mapToCortexUserAction(item.metadata.userAction)
        });

        const feedbackData = {
          searchId: searchEvent.id,
          queryHash: item.metadata.queryHash,
          resultId: item.metadata.resultId,
          relevanceScore: item.rating,
          userAction: mapToCortexUserAction(item.metadata.userAction),
          metadata: {
            timestamp: item.metadata.timestamp,
            engagementType: item.metadata.engagementType,
            originalRating: item.rating,
            customData: item.metadata.customMetadata
          },
          testData: item.metadata.customMetadata?.testId && item.metadata.customMetadata?.variantId ? {
            variantId: String(item.metadata.customMetadata.variantId)
          } : undefined
        };

        logger.debug("Processing feedback item", {
          feedbackData,
          userAction: item.metadata.userAction,
          mappedAction: mapToCortexUserAction(item.metadata.userAction),
          searchEventId: searchEvent.id,
        });

        try {
          const result = await services.feedback.recordFeedbackWithOptimization(feedbackData);
          feedbackResults.push({
            success: true,
            data: result,
            feedbackData
          });
        } catch (itemError) {
          logger.error("Failed to process individual feedback item", {
            error: itemError,
            feedbackData,
            searchEventId: searchEvent.id,
            errorDetails: itemError instanceof Error ? {
              message: itemError.message,
              name: itemError.name,
              stack: itemError.stack
            } : 'Unknown error type'
          });
          feedbackResults.push({
            success: false,
            error: itemError,
            feedbackData
          });
          // Don't throw here, continue processing other items
        }
      }

      // Check if any feedback items failed
      const failedItems = feedbackResults.filter(r => !r.success);
      if (failedItems.length > 0) {
        logger.error("Some feedback items failed to process", {
          totalItems: feedback.length,
          failedCount: failedItems.length,
          failedItems: failedItems.map(f => ({
            queryId: f.feedbackData.searchId,
            error: f.error instanceof Error ? f.error.message : String(f.error)
          }))
        });
        throw new Error(`Failed to process ${failedItems.length} feedback items`);
      }

      logger.info("Successfully processed all feedback items", {
        feedbackCount: feedback.length,
        searchEventId: searchEvent.id,
        firstItemAction: feedback[0]?.metadata.userAction,
        firstItemMappedAction: feedback[0]
          ? mapToCortexUserAction(feedback[0].metadata.userAction)
          : null,
        results: feedbackResults.map(r => ({
          queryId: r.feedbackData.searchId,
          success: r.success
        }))
      });
    } catch (feedbackError) {
      logger.error("Failed to process feedback", {
        error: feedbackError,
        searchEventId: searchEvent.id,
        errorDetails: feedbackError instanceof Error ? {
          message: feedbackError.message,
          name: feedbackError.name,
          stack: feedbackError.stack
        } : 'Unknown error type'
      });
      throw new Error(feedbackError instanceof Error ? feedbackError.message : "Feedback processing failed");
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
