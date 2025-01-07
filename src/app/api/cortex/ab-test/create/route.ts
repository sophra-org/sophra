import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";

const ABTestVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  allocation: z.number().min(0).max(1),
  weights: z.record(z.number()),
});

const CreateABTestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "COMPLETED"]).optional(),
  variants: z.array(ABTestVariantSchema).min(2),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody = null;
  let services = null;

  try {
    services = await serviceManager.getServices();

    if (!services.abTesting) {
      logger.error("AB Testing service not available");
      throw new Error("AB Testing service not initialized");
    }

    rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const validationResult = CreateABTestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.format(),
          receivedData: body,
          help: {
            example: {
              name: "My Test",
              description: "Test description",
              variants: [
                {
                  id: "control",
                  name: "Control",
                  allocation: 0.5,
                  weights: { score: 1.0 },
                },
                {
                  id: "variant_a",
                  name: "Variant",
                  allocation: 0.5,
                  weights: { score: 1.2 },
                },
              ],
            },
          },
        },
        { status: 400 }
      );
    }

    const test = await services.abTesting.createTest({
      name: validationResult.data.name,
      description: validationResult.data.description,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      configuration: {
        variants: validationResult.data.variants,
      },
    });

    return NextResponse.json({
      success: true,
      data: test,
      meta: {
        took: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to create A/B test", {
      error,
      rawBody,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create A/B test",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        context: {
          rawBody,
          stack: error instanceof Error ? error.stack : undefined,
          serviceStatus: {
            available: services?.abTesting ? true : false,
            services: services ? Object.keys(services) : [],
          },
        },
      },
      { status: 500 }
    );
  }
}
