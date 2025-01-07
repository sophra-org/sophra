import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { Prisma, ModelType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const ModelCreateSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(ModelType),
  hyperparameters: z.record(z.unknown()),
  features: z.array(z.string()),
  trainingParams: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    logger.info("Received models request", {
      url: req.url,
      headers: Object.fromEntries(req.headers),
    });

    const models = await prisma.modelConfig.findMany({
      include: {
        modelVersions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    logger.info("Retrieved models from database", {
      modelCount: models.length,
      took: Date.now() - startTime,
    });

    const transformedModels = models.map((model) => ({
      id: model.id,
      type: model.type,
      isTrained: model.modelVersions[0]?.artifactPath !== null,
      trainingProgress: 0,
      lastTrainingError: null,
      metrics: model.modelVersions[0]?.metrics || {},
      createdAt: model.modelVersions[0]?.createdAt,
      updatedAt: model.modelVersions[0]?.createdAt,
    }));

    logger.info("Transformed models response", {
      modelCount: transformedModels.length,
      took: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: transformedModels,
      metadata: {
        took: Date.now() - startTime,
        count: transformedModels.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to fetch models", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
      took: latency,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch models",
        metadata: {
          took: latency,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = ModelCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { type, hyperparameters, features, trainingParams } = validation.data;

    const model = await prisma.modelConfig.create({
      data: {
        type,
        hyperparameters: hyperparameters as Prisma.InputJsonValue,
        features: features as string[],
        trainingParams: trainingParams as Prisma.InputJsonValue,
        modelVersions: {
          create: {
            metrics: {} as Prisma.InputJsonValue,
            artifactPath: "",
            parentVersion: null,
          },
        },
      },
      include: {
        modelVersions: true,
      },
    });

    logger.info("Created new model", { modelId: model.id, type });

    return NextResponse.json({
      success: true,
      data: {
        id: model.id,
        type: model.type,
        isTrained: false,
        trainingProgress: 0,
        createdAt: model.modelVersions?.[0]?.createdAt ?? new Date(),
        updatedAt: model.modelVersions?.[0]?.createdAt ?? new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to create model", { error });
    return NextResponse.json(
      { success: false, error: "Failed to create model" },
      { status: 500 }
    );
  }
}
