import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { Prisma, ModelType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const ModelCreateSchema = z.object({
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
      modelCount: models?.length || 0,
      took: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: models || [],
      meta: {
        total: models?.length || 0,
        page: 1,
        pageSize: 10,
        took: Date.now() - startTime
      }
    }, { status: 200 });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error("Failed to fetch models", {
      error: error instanceof Error ? error : new Error(String(error)),
      took: latency,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch models",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: latency,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const validation = ModelCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validation.error.format(),
          meta: {
            took: Date.now() - startTime
          }
        },
        { status: 400 }
      );
    }

    const { type, hyperparameters, features, trainingParams } = validation.data;

    try {
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
        data: model,
        meta: {
          took: Date.now() - startTime
        }
      }, { status: 200 });
    } catch (dbError) {
      logger.error("Database error creating model", { dbError });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create model",
          details: "DB Error",
          meta: {
            took: Date.now() - startTime
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to create model", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create model",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: Date.now() - startTime
        }
      },
      { status: 500 }
    );
  }
}
