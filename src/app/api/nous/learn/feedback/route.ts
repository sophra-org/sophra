import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { EngagementType, Prisma, SignalType } from "@prisma/client";
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
      })
    })
  ),
});

export async function GET(): Promise<NextResponse> {
  try {
    const feedback = await prisma.feedbackRequest.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error("Failed to fetch feedback", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = FeedbackSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid feedback request", {
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

    const { feedback } = validation.data;
    const timestamp = new Date();

    const feedbackRecord = await prisma.feedbackRequest.create({
      data: {
        feedback: feedback as Prisma.InputJsonValue,
        timestamp,
      },
    });

    logger.info("Recorded feedback", {
      feedbackCount: feedback.length,
      timestamp: timestamp.toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: feedbackRecord.id,
        timestamp: timestamp,
        feedbackCount: feedback.length,
        feedback: feedback.map((item) => ({
          queryId: item.queryId,
          rating: item.rating,
          action: item.metadata.userAction,
          timestamp: item.metadata.timestamp,
        })),
        metadata: {
          processedAt: timestamp.toISOString(),
          uniqueQueries: new Set(feedback.map((f) => f.queryId)).size,
          averageRating:
            feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length,
          actions: feedback.map((f) => f.metadata.userAction),
        },
      },
    });
  } catch (error) {
    logger.error("Failed to record feedback", { error });
    return NextResponse.json(
      { success: false, error: "Failed to record feedback" },
      { status: 500 }
    );
  }
}
