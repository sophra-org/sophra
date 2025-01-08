import { AdaptationEngine } from "@lib/shared/engine/adaptation-engine";
import logger from "@lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lib/shared/database/client";

// Declare Node.js runtime
export const runtime = "nodejs";

const AdaptationRequestSchema = z.object({
  ruleIds: z.array(z.string()),
  context: z.record(z.unknown()),
  metrics: z.record(z.number()).optional(),
});

let engine: AdaptationEngine;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!engine) {
    engine = new AdaptationEngine(logger);
  }
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validation = AdaptationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid request format", 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { ruleIds, context, metrics } = validation.data;

    // Validate rule IDs
    if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "No rule IDs provided" 
        },
        { status: 400 }
      );
    }

    // Fetch rules from database
    let rules;
    try {
      rules = await prisma.adaptationRule.findMany({
        where: {
          id: { in: ruleIds },
          enabled: true,
        },
      });

      if (!rules || rules.length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: "No valid rules found"
          },
          { status: 404 }
        );
      }
    } catch (dbError) {
      logger.error("Database error fetching rules:", { dbError });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to apply adaptations",
          details: "Database error",
        },
        { status: 500 }
      );
    }

    try {
      // Update engine state
      if (metrics) {
        engine.updateMetrics(metrics);
      }
      engine.updateState(context);

      // Apply rules
      await engine.evaluateEvent({
        type: "adaptation_request",
        rules: rules.map((r) => r.id),
        context,
      });

      const processingTime = Date.now() - startTime;

      logger.info("Applied adaptation rules", {
        ruleCount: rules.length,
        processingTime,
        ruleIds,
      });

      return NextResponse.json({
        success: true,
        applied_rules: rules.length,
        processing_time_ms: processingTime,
      });
    } catch (engineError) {
      logger.error("Engine error during adaptation:", { engineError });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to apply adaptations",
          details: "Engine error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to apply adaptations:", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to apply adaptations",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" && error instanceof Error 
          ? error.stack 
          : undefined,
      },
      { status: 500 }
    );
  }
}
