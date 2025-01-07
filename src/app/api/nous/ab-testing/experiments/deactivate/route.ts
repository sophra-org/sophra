import { prisma } from "@/lib/shared/database/client";
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.experimentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
        },
        { status: 400 }
      );
    }

    const experiment = await prisma.aBTest.findUnique({
      where: { id: body.experimentId },
    });

    if (!experiment) {
      logger.info("Experiment not found", { experimentId: body.experimentId });
      return NextResponse.json(
        {
          success: false,
          error: "Experiment not found",
        },
        { status: 404 }
      );
    }

    if (experiment.status === ExperimentStatus.INACTIVE) {
      logger.info("Experiment is already inactive", {
        experimentId: body.experimentId,
        name: experiment.name,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Experiment is already inactive",
        },
        { status: 400 }
      );
    }

    const updatedExperiment = await prisma.aBTest.update({
      where: { id: body.experimentId },
      data: {
        status: ExperimentStatus.INACTIVE,
        endDate: new Date(),
      },
    });

    logger.info("Deactivated experiment", {
      experimentId: body.experimentId,
      name: experiment.name,
    });

    return NextResponse.json({
      success: true,
      data: updatedExperiment,
    });
  } catch (error) {
    logger.error("Failed to deactivate experiment", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deactivate experiment",
      },
      { status: 500 }
    );
  }
}
