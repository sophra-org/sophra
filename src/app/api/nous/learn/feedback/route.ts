import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { EngagementType, SignalType } from "@prisma/client";
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

    const formattedFeedback = feedback.map((f) => ({
      id: f.id,
      feedback: (f.feedback as any[]).map((item) => ({
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
        feedbackCount: (f.feedback as any[]).length,
        averageRating:
          (f.feedback as any[]).reduce((acc, item) => acc + item.rating, 0) /
          (f.feedback as any[]).length,
        uniqueQueries: new Set(
          (f.feedback as any[]).map((item) => item.queryId)
        ).size,
      },
    }));

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
    const result = await prisma.feedbackRequest.create({
      data: {
        feedback: JSON.stringify(feedback.feedback),
        timestamp: new Date(),
      },
    });

    const metrics = {
      averageRating:
        feedback.feedback.reduce((acc, item) => acc + item.rating, 0) /
        feedback.feedback.length,
      feedbackCount: feedback.feedback.length,
      uniqueQueries: new Set(feedback.feedback.map((item) => item.queryId))
        .size,
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
