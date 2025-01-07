import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    if (!params?.id) {
      logger.error("Model ID not provided");
      return NextResponse.json(
        { success: false, error: "Model ID is required" },
        { status: 400 }
      );
    }

    const model = await prisma.modelConfig.findUnique({
      where: { id: params.id },
      include: {
        modelVersions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!model) {
      logger.warn("Model not found", { modelId: params.id });
      return NextResponse.json(
        { success: false, error: "Model not found" },
        { status: 404 }
      );
    }

    logger.info("Retrieved model details", {
      modelId: params.id,
      type: model.type,
      hasVersions: model.modelVersions.length > 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: model.id,
        type: model.type,
        isTrained: model.modelVersions[0]?.artifactPath !== null,
        trainingProgress: 0,
        lastTrainingError: null,
        metrics: model.modelVersions[0]?.metrics || {},
        hyperparameters: model.hyperparameters,
        features: model.features,
        trainingParams: model.trainingParams,
        createdAt: model.modelVersions[0]?.createdAt,
        updatedAt: model.modelVersions[0]?.createdAt,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch model", {
      error: error instanceof Error ? error.message : "Unknown error",
      modelId: params?.id,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch model" },
      { status: 500 }
    );
  }
}
