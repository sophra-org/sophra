import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Declare Node.js runtime
export const runtime = "nodejs";

const ModelSyncSchema = z.object({
  modelId: z.string(),
  state: z.object({
    weights: z.array(z.number()),
    bias: z.number(),
    scaler: z.object({
      mean: z.array(z.number()),
      std: z.array(z.number()),
    }),
    featureNames: z.array(z.string()),
    metrics: z.object({
      accuracy: z.number().optional(),
      precision: z.number().optional(),
      recall: z.number().optional(),
      f1Score: z.number().optional(),
      latencyMs: z.number().optional(),
      loss: z.number().optional(),
    }).optional().or(z.record(z.unknown())),
    hyperparameters: z.record(z.unknown()).optional(),
    currentEpoch: z.number().optional(),
    trainingProgress: z.number().min(0).max(1).optional(),
    lastTrainingError: z.string().nullable().optional(),
  }),
});

export async function GET(): Promise<NextResponse> {
  try {
    const states = await prisma.modelState.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        metrics: true,
      },
    });

    logger.info("Retrieved model states", {
      count: states.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: states,
    });
  } catch (error) {
    logger.error("Failed to fetch model states", { error });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch model states",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    logger.info("Received sync request", { body: JSON.stringify(body) });
    const validation = ModelSyncSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid model sync request", {
        errors: validation.error.errors,
        received: JSON.stringify(body),
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request format",
          details: validation.error.errors,
          meta: {
            timestamp: new Date().toISOString(),
            request: body
          }
        },
        { status: 400 }
      );
    }

    const { modelId, state } = validation.data;

    // First, verify the model exists
    const model = await prisma.modelConfig.findUnique({
      where: { id: modelId },
      include: {
        modelVersions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!model || !model.modelVersions.length) {
      logger.warn("Model not found for sync", { modelId });
      return NextResponse.json(
        { 
          success: false, 
          error: "Model not found",
          meta: {
            timestamp: new Date().toISOString(),
            request: { modelId }
          }
        },
        { status: 404 }
      );
    }

    const latestVersion = model.modelVersions[0];

    try {
      // Create or update model state
      const modelState = await prisma.modelState.upsert({
        where: { versionId: latestVersion.id },
        create: {
          versionId: latestVersion.id,
          weights: state.weights,
          bias: state.bias,
          scaler: state.scaler as unknown as Prisma.InputJsonValue,
          featureNames: state.featureNames,
          isTrained: true,
          modelType: model.type,
          hyperparameters: (state.hyperparameters || {}) as Prisma.InputJsonValue,
          currentEpoch: state.currentEpoch || 0,
          trainingProgress: state.trainingProgress || 1,
          lastTrainingError: state.lastTrainingError,
          metrics: state.metrics ? {
            create: {
              modelVersionId: latestVersion.id,
              accuracy: (state.metrics as any).accuracy || 0,
              precision: (state.metrics as any).precision || 0,
              recall: (state.metrics as any).recall || 0,
              f1Score: (state.metrics as any).f1Score || 0,
              latencyMs: (state.metrics as any).latencyMs || 0,
              loss: (state.metrics as any).loss || 0,
              validationMetrics: state.metrics as Prisma.InputJsonValue || Prisma.JsonNull,
              customMetrics: Prisma.JsonNull,
              timestamp: new Date(),
            },
          } : undefined,
        },
        update: {
          weights: state.weights,
          bias: state.bias,
          scaler: state.scaler as unknown as Prisma.InputJsonValue,
          featureNames: state.featureNames,
          isTrained: true,
          hyperparameters: (state.hyperparameters || {}) as unknown as Prisma.InputJsonValue,
          currentEpoch: state.currentEpoch || 0,
          trainingProgress: state.trainingProgress || 1,
          lastTrainingError: state.lastTrainingError,
          metrics: state.metrics ? {
            deleteMany: {},
            create: {
              modelVersionId: latestVersion.id,
              accuracy: (state.metrics as any).accuracy || 0,
              precision: (state.metrics as any).precision || 0,
              recall: (state.metrics as any).recall || 0,
              f1Score: (state.metrics as any).f1Score || 0,
              latencyMs: (state.metrics as any).latencyMs || 0,
              loss: (state.metrics as any).loss || 0,
              validationMetrics: state.metrics as Prisma.InputJsonValue,
              customMetrics: Prisma.JsonNull,
              timestamp: new Date(),
            },
          } : undefined,
        },
      });

      logger.info("Synced model state", {
        modelId,
        stateId: modelState.id,
        versionId: latestVersion.id,
        isTrained: modelState.isTrained,
        progress: modelState.trainingProgress,
      });

      return NextResponse.json({
        success: true,
        data: modelState,
        meta: {
          timestamp: new Date().toISOString(),
          request: { modelId, state }
        }
      }, { status: 201 });
    } catch (dbError) {
      logger.error("Database error during model sync", {
        error: dbError instanceof Error ? dbError : new Error(String(dbError)),
        modelId,
        versionId: latestVersion.id,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to sync model state",
          meta: {
            timestamp: new Date().toISOString(),
            request: { modelId }
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to process model sync request", { error: errorMessage });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process request",
        meta: {
          timestamp: new Date().toISOString(),
          error: errorMessage
        }
      },
      { status: 500 }
    );
  }
}
