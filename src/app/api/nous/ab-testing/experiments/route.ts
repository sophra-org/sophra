import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/shared/database/client";

const VariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0).max(1),
  config: z.record(z.unknown())
});

const ExperimentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  configuration: z.object({
    variants: z.array(VariantSchema),
    trafficAllocation: z.number().min(0).max(1),
    targetMetrics: z.array(z.string())
  })
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit')) || 10));
    const status = searchParams.get('status') as ExperimentStatus | null;

    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [experiments, total] = await Promise.all([
      prisma.aBTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aBTest.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: experiments,
      metadata: {
        total,
        page,
        limit,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    logger.error('Failed to fetch experiments', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch experiments'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ExperimentSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Invalid experiment data', {
        errors: validation.error.format(),
        received: body
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid experiment data',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, ...rest } = validation.data;
    
    // Convert configuration to JSON string for Prisma
    const configuration = JSON.stringify({
      ...rest.configuration,
      variants: rest.configuration.variants.map(v => ({
        ...v,
        weight: Number(v.weight) // Ensure weights are numbers
      }))
    });

    const experiment = await prisma.aBTest.create({
      data: {
        ...rest,
        status: ExperimentStatus.PENDING,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        configuration
      }
    });

    logger.info('Created new experiment', {
      experimentId: experiment.id,
      name: experiment.name,
      configuration: JSON.parse(configuration)
    });

    return NextResponse.json(
      {
        success: true,
        data: experiment
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create experiment', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create experiment'
      },
      { status: 500 }
    );
  }
}
