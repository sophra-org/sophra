import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    metrics: z
      .object({
        accuracy: z.number().optional(),
        precision: z.number().optional(),
        recall: z.number().optional(),
        f1Score: z.number().optional(),
        latencyMs: z.number().optional(),
        loss: z.number().optional(),
      })
      .optional()
      .or(z.record(z.unknown())),
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validationResult = ModelSyncSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error("Invalid model sync request", {
        error: validationResult.error.format(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { modelId, state } = validationResult.data;

    // Check if model exists
    const existingModel = await prisma.modelConfig.findUnique({
      where: { id: modelId },
    });

    if (!existingModel) {
      return NextResponse.json(
        {
          success: false,
          error: "Model not found",
          details: `No model found with ID: ${modelId}`,
        },
        { status: 404 }
      );
    }

    try {
      // Create new model state
      const modelState = await prisma.modelState.create({
        data: {
          versionId: modelId,
          weights: state.weights,
          bias: state.bias,
          scaler: state.scaler as Prisma.InputJsonValue,
          featureNames: state.featureNames,
          metrics: state.metrics
            ? {
                create: [
                  {
                    modelVersionId: modelId,
                    accuracy: Number(state.metrics.accuracy ?? 0),
                    precision: Number(state.metrics.precision ?? 0),
                    recall: Number(state.metrics.recall ?? 0),
                    f1Score: Number(state.metrics.f1Score ?? 0),
                    latencyMs: Number(state.metrics.latencyMs ?? 0),
                    loss: Number(state.metrics.loss ?? 0),
                    validationMetrics: state.metrics as Prisma.InputJsonValue,
                    customMetrics: Prisma.JsonNull,
                    timestamp: new Date(),
                  },
                ],
              }
            : undefined,
          hyperparameters:
            (state.hyperparameters as Prisma.InputJsonValue) || Prisma.JsonNull,
          currentEpoch: state.currentEpoch,
          trainingProgress: state.trainingProgress,
          lastTrainingError: state.lastTrainingError,
        },
      });

      logger.info("Model state synced successfully", {
        modelId,
        stateId: modelState.id,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            modelId,
            stateId: modelState.id,
          },
          message: "Model state synced successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      logger.error("Failed to sync model state", {
        error,
        modelId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to sync model state",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unexpected error in model sync", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
