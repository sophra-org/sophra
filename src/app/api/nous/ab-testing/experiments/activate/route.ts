import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const ActivateSchema = z.object({
  experimentId: z.string(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = ActivateSchema.safeParse(body);

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

    const { experimentId } = validation.data;

    const experiment = await prisma.aBTest.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      return NextResponse.json(
        {
          success: false,
          error: "Experiment not found",
        },
        { status: 404 }
      );
    }

    if (experiment.status === "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Experiment is already active",
        },
        { status: 400 }
      );
    }

    const updatedExperiment = await prisma.aBTest.update({
      where: { id: experimentId },
      data: { status: "ACTIVE" },
    });

    logger.info("Activated experiment", {
      experimentId,
      name: updatedExperiment.name,
    });

    return NextResponse.json({
      success: true,
      data: updatedExperiment,
    });
  } catch (error) {
    logger.error("Failed to activate experiment", { error });
    return NextResponse.json(
      { success: false, error: "Failed to activate experiment" },
      { status: 500 }
    );
  }
}
