import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";
import { z } from "zod";
import { createHash } from "crypto";

const ApplySchema = z.object({
  experimentId: z.string(),
  context: z.object({
    userId: z.string(),
    sessionId: z.string()
  })
});

function determineVariant(experimentId: string, userId: string, variants: string[], distribution: number[]): string {
  // Create a deterministic hash based on experimentId and userId
  const hash = createHash('sha256')
    .update(`${experimentId}:${userId}`)
    .digest('hex');

  // Convert first 8 characters of hash to number between 0 and 1
  const hashNum = parseInt(hash.slice(0, 8), 16) / 0xffffffff;

  // Use the hash to select a variant based on distribution
  let cumulativeProb = 0;
  for (let i = 0; i < distribution.length; i++) {
    cumulativeProb += distribution[i];
    if (hashNum < cumulativeProb) {
      return variants[i];
    }
  }

  // Fallback to last variant if we somehow exceed cumulative probability
  return variants[variants.length - 1];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ApplySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format'
        },
        { status: 400 }
      );
    }

    const { experimentId, context } = validation.data;

    const experiment = await prisma.aBTest.findUnique({
      where: { id: experimentId }
    });

    if (!experiment) {
      logger.info('Experiment not found', { experimentId });
      return NextResponse.json(
        {
          success: false,
          error: 'Experiment not found'
        },
        { status: 404 }
      );
    }

    if (experiment.status !== ExperimentStatus.ACTIVE) {
      logger.info('Experiment is not active', {
        experimentId,
        status: experiment.status
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Experiment is not active'
        },
        { status: 400 }
      );
    }

    const { variants, distribution } = experiment.configuration as {
      variants: string[];
      distribution: number[];
    };

    const variant = determineVariant(experimentId, context.userId, variants, distribution);

    logger.info('Applied experiment variant', {
      experimentId,
      variant,
      context
    });

    return NextResponse.json({
      success: true,
      data: {
        experimentId,
        variant,
        context
      }
    });
  } catch (error) {
    logger.error('Failed to apply experiment', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply experiment'
      },
      { status: 500 }
    );
  }
} 