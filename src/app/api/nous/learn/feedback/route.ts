import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { EngagementType, LearningEventPriority, LearningEventStatus, LearningEventType, MetricType, SignalType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const FeedbackSchema = z.object({
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

export async function GET(): Promise<NextResponse> {
  try {
    const feedback = await prisma.feedbackRequest.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    const formattedFeedback = feedback.map((f) => {
      // Parse the stringified feedback JSON
      const parsedFeedback = JSON.parse(f.feedback as string);
      return {
        id: f.id,
        feedback: parsedFeedback.map((item: any) => ({
        queryId: item.queryId,
        rating: item.rating,
        metadata: {
          userAction: item.metadata.userAction,
          resultId: item.metadata.resultId,
          queryHash: item.metadata.queryHash,
          timestamp: item.metadata.timestamp,
          engagementType: item.metadata.engagementType,
        },
      })),
        timestamp: f.timestamp,
        meta: {
          feedbackCount: parsedFeedback.length,
          averageRating:
            parsedFeedback.reduce((acc: number, item: any) => acc + item.rating, 0) /
            parsedFeedback.length,
          uniqueQueries: new Set(
            parsedFeedback.map((item: any) => item.queryId)
          ).size,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedFeedback,
      meta: {
        total: formattedFeedback.length,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch feedback",
        meta: { total: 0 },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validationResult = FeedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validationResult.error,
        },
        { status: 400 }
      );
    }

    const feedback = validationResult.data;
    // Calculate metrics first
    const now = new Date();
    const averageRating = feedback.feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.feedback.length;
    const uniqueQueries = new Set(feedback.feedback.map((item) => item.queryId)).size;
    const clicks = feedback.feedback.filter(f => f.metadata.engagementType === "CLICK").length;
    const conversions = feedback.feedback.filter(f => f.metadata.engagementType === "CONVERSION").length;
    const impressions = feedback.feedback.filter(f => f.metadata.engagementType === "IMPRESSION").length;
    const total = feedback.feedback.length;

    // Create feedback request and learning event
    const [result, learningEvent] = await Promise.all([
      prisma.feedbackRequest.create({
        data: {
          feedback: JSON.stringify(feedback.feedback),
          timestamp: now,
        },
      }),
      prisma.learningEvent.create({
        data: {
          type: LearningEventType.USER_FEEDBACK,
          status: LearningEventStatus.COMPLETED,
          priority: LearningEventPriority.MEDIUM,
          timestamp: now,
          metadata: {
            feedbackCount: total,
            averageRating,
            uniqueQueries,
            engagementStats: {
              clicks,
              conversions,
              impressions,
              total
            }
          },
          retryCount: 0,
          tags: ['feedback', 'user-engagement']
        }
      })
    ]);

    logger.info("Created feedback request and learning event", {
      feedbackId: result.id,
      eventId: learningEvent.id,
      timestamp: now.toISOString(),
      metrics: {
        averageRating,
        uniqueQueries,
        clicks,
        conversions,
        impressions,
        total
      }
    });

    logger.debug("Creating metrics", {
      feedbackCount: total,
      metrics: {
        feedback_score: averageRating,
        engagement_rate: (clicks + conversions) / total,
        click_through: impressions > 0 ? clicks / impressions : 0,
        conversion_rate: clicks > 0 ? conversions / clicks : 0
      },
      counts: {
        clicks,
        conversions,
        impressions,
        total
      }
    });

    const createdMetrics = await Promise.all([
      // Feedback score metric
      prisma.learningMetric.create({
        data: {
          type: MetricType.FEEDBACK_SCORE,
          value: averageRating,
          timestamp: now,
          interval: "1h",
          timeframe: "24h",
          count: total,
          aggregated: false,
          metadata: {
            feedbackCount: total,
            uniqueQueries,
            feedbackIds: feedback.feedback.map(f => f.queryId),
            userActions: feedback.feedback.map(f => f.metadata.userAction),
            engagementTypes: feedback.feedback.map(f => f.metadata.engagementType).filter(Boolean)
          }
        }
      }),
      // Engagement rate metric
      prisma.learningMetric.create({
        data: {
          type: MetricType.ENGAGEMENT_RATE,
          value: (clicks + conversions) / total,
          timestamp: now,
          interval: "1h",
          timeframe: "24h",
          count: total,
          aggregated: false,
          metadata: {
            clicks,
            conversions,
            total,
            userActions: feedback.feedback.map(f => f.metadata.userAction),
            engagementTypes: feedback.feedback.map(f => f.metadata.engagementType).filter(Boolean)
          }
        }
      }),
      // Click-through rate metric
      prisma.learningMetric.create({
        data: {
          type: MetricType.CLICK_THROUGH,
          value: impressions > 0 ? clicks / impressions : 0,
          timestamp: now,
          interval: "1h",
          timeframe: "24h",
          count: total,
          aggregated: false,
          metadata: {
            clicks,
            impressions,
            total,
            clickThroughRate: impressions > 0 ? clicks / impressions : 0,
            userActions: feedback.feedback.map(f => f.metadata.userAction),
            engagementTypes: feedback.feedback.map(f => f.metadata.engagementType).filter(Boolean)
          }
        }
      }),
      // Conversion rate metric
      prisma.learningMetric.create({
        data: {
          type: MetricType.CONVERSION_RATE,
          value: clicks > 0 ? conversions / clicks : 0, // Conversions per click
          timestamp: now,
          interval: "1h",
          timeframe: "24h",
          count: total,
          aggregated: false,
          metadata: {
            clicks,
            conversions,
            total,
            conversionRate: clicks > 0 ? conversions / clicks : 0,
            conversionPerImpression: impressions > 0 ? conversions / impressions : 0,
            userActions: feedback.feedback.map(f => f.metadata.userAction),
            engagementTypes: feedback.feedback.map(f => f.metadata.engagementType).filter(Boolean)
          }
        }
      })
    ]);

    logger.info("Created metrics", {
      count: createdMetrics.length,
      types: createdMetrics.map(m => m.type),
      timestamp: now.toISOString()
    });

    const metrics = {
      averageRating,
      feedbackCount: feedback.feedback.length,
      uniqueQueries
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.id,
          feedback: feedback.feedback,
          timestamp: result.timestamp,
          meta: metrics,
        },
        meta: { total: 1 },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Failed to record feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record feedback",
        meta: { total: 0 },
      },
      { status: 500 }
    );
  }
}
