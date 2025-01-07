import prisma from "@/lib/shared/database/client";
import { AdaptationEngine } from "@/lib/shared/engine/adaptation-engine";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const AdaptationRequestSchema = z.object({
  ruleIds: z.array(z.string()),
  context: z.record(z.unknown()),
  metrics: z.record(z.number()).optional(),
});

const engine = new AdaptationEngine(logger);

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validation = AdaptationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request format", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { ruleIds, context, metrics } = validation.data;

    // Fetch rules from database
    const rules = await prisma.adaptationRule.findMany({
      where: {
        id: { in: ruleIds },
        enabled: true,
      },
    });

    if (rules.length === 0) {
      return NextResponse.json(
        { error: "No valid rules found" },
        { status: 404 }
      );
    }

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
  } catch (error) {
    logger.error("Failed to apply adaptations:", { error });
    return NextResponse.json(
      {
        error: "Failed to apply adaptations",
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
