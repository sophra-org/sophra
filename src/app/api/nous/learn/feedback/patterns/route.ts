import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const queryParamsSchema = z.object({
  timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
  limit: z.coerce.number().min(1).max(1000).default(100),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const validationResult = queryParamsSchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          details: validationResult.error.format(),
          meta: { 
            took: Date.now() - startTime,
            generated_at: new Date().toISOString()
          },
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    const timeframeMap = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(Date.now() - timeframeMap[params.timeframe]);

    const feedbackPatterns = await prisma.feedbackRequest.findMany({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: params.limit,
    });

    const patterns = feedbackPatterns.map((pattern) => {
      const feedback = pattern.feedback as any[];
      const confidence = calculateConfidence(feedback);
      const averageRating = calculateAverageRating(feedback);
      
      return {
        query_id: pattern.id,
        pattern_type: "FEEDBACK",
        confidence,
        metadata: {
          averageRating,
          uniqueQueries: new Set(feedback.map((f) => f.queryId)).size,
          totalFeedback: feedback.length,
          actions: feedback.map((f) => f.metadata.userAction),
          engagementTypes: feedback
            .map((f) => f.metadata.engagementType)
            .filter(Boolean),
        },
        timestamp: pattern.timestamp.toISOString(),
      };
    });

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      patterns,
      meta: {
        generated_at: new Date().toISOString(),
        timeframe: params.timeframe,
        total: patterns.length,
        took: latency,
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to process feedback patterns request", {
      error: error instanceof Error ? error : new Error(String(error)),
      took: latency,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch feedback patterns",
        meta: { 
          took: latency,
          generated_at: new Date().toISOString()
        },
      },
      { status: 500 }
    );
  }
}

 function calculateConfidence(feedback: any[]): number {
  if (!feedback || feedback.length === 0) return 0;

  const sampleSize = feedback.length;
  const baseConfidence = Math.min(sampleSize / 100, 1); // Scale with sample size up to 100
  const consistencyScore = calculateConsistencyScore(feedback);
  return Math.round(baseConfidence * consistencyScore * 100) / 100;
}

function calculateConsistencyScore(feedback: any[]): number {
  if (!feedback || feedback.length < 2) return 0.5;

  const ratings = feedback.map((f) => f.rating);
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance =
    ratings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratings.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation means more consistent ratings
  return Math.max(0, 1 - standardDeviation);
}

function calculateAverageRating(feedback: any[]): number {
  if (!feedback || feedback.length === 0) return 0;
  return (
    Math.round(
      (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length) * 100
    ) / 100
  );
}
