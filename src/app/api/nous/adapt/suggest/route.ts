import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { AdaptationSuggestion } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const SuggestRuleSchema = z.object({
  queryHash: z.string(),
  patterns: z.object({
    averageRelevance: z.number().min(0).max(1),
    clickThroughRate: z.number().min(0).max(1),
    conversionRate: z.number().min(0).max(1),
    requiresOptimization: z.boolean(),
    confidence: z.number().min(0).max(1),
  }),
  confidence: z.number().min(0).max(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    logger.info("Received adaptation suggestion request", {
      url: req.url,
      headers: Object.fromEntries(req.headers),
    });

    const body = await req.json();
    const validationResult = SuggestRuleSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error("Invalid rule suggestion format", {
        errors: validationResult.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid rule suggestion format",
          details: validationResult.error.format(),
          code: "ADAPT001",
          metadata: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const { queryHash, patterns, confidence } = validationResult.data;

    // Store suggestion in database
    const suggestion = await prisma.$queryRaw<AdaptationSuggestion[]>`
      INSERT INTO "AdaptationSuggestion" (
        "id",
        "queryHash",
        "patterns",
        "confidence",
        "status",
        "metadata",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${queryHash},
        ${patterns}::jsonb,
        ${confidence},
        'PENDING',
        ${JSON.stringify({
          timestamp: new Date().toISOString(),
          source: "API",
        })}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    // Use suggestion[0] for the first (and only) result
    const createdSuggestion = suggestion[0];

    logger.info("Stored adaptation suggestion", {
      suggestionId: createdSuggestion.id,
      queryHash,
      patterns: {
        averageRelevance: patterns.averageRelevance,
        clickThroughRate: patterns.clickThroughRate,
        conversionRate: patterns.conversionRate,
        requiresOptimization: patterns.requiresOptimization,
        confidence: patterns.confidence,
      },
    });

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      data: {
        suggestionId: createdSuggestion.id,
      },
      message: "Rule suggestion submitted successfully",
      code: "ADAPT000",
      metadata: {
        took: latency,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to process adaptation suggestion", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      code: "ADAPT999",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process adaptation suggestion",
        code: "ADAPT999",
        details: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          took: latency,
          timestamp: new Date().toISOString(),
          errorType: error instanceof Error ? error.name : typeof error,
        },
      },
      { status: 500 }
    );
  }
}
