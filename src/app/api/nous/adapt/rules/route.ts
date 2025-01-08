import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { RulePriority, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const AdaptationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  conditions: z.record(z.unknown()),
  actions: z.record(z.unknown()),
  priority: z.nativeEnum(RulePriority),
  enabled: z.boolean().default(true),
});

const AdaptationRuleListSchema = z.object({
  rules: z.array(AdaptationRuleSchema),
});

export async function GET(): Promise<NextResponse> {
  try {
    const rules = await prisma.adaptationRule.findMany({
      orderBy: { priority: "asc" },
    });

    // Always return rules array, empty if none found
    return NextResponse.json({ 
      success: true,
      rules: rules || []
    });
  } catch (error) {
    logger.error("Failed to fetch adaptation rules:", { error });
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch adaptation rules",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = AdaptationRuleListSchema.safeParse(body);

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

    const { rules } = validation.data;

    // Handle empty rules array
    if (!rules.length) {
      return NextResponse.json({
        success: true,
        rules: []
      });
    }

    // Use transaction to ensure all rules are created or none
    const createdRules = await prisma.$transaction(
      rules.map(rule => 
        prisma.adaptationRule.create({
          data: {
            name: rule.name,
            description: rule.description,
            type: rule.type,
            conditions: rule.conditions as Prisma.InputJsonValue,
            actions: rule.actions as Prisma.InputJsonValue,
            priority: rule.priority,
            enabled: rule.enabled,
          },
        })
      )
    );

    logger.info("Created adaptation rules:", {
      count: createdRules.length,
      ruleIds: createdRules.map((r) => r.id),
    });

    return NextResponse.json({
      success: true,
      rules: createdRules,
    });
  } catch (error) {
    logger.error("Failed to create adaptation rules:", { error });
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create adaptation rules",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
