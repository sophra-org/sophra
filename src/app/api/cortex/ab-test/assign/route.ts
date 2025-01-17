import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";

const assignSchema = z
  .object({
    sessionId: z
      .string()
      .min(1, "Session ID is required")
      .regex(/^[a-zA-Z0-9]+$/, "Invalid session ID format"),
    testId: z.string().optional(),
    testName: z.string().optional(),
  })
  .refine(
    (data: { sessionId: string; testId?: string; testName?: string }) =>
      data.testId || data.testName,
    {
      message: "Either testId or testName must be provided",
    }
  );

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody: string | null = null;
  let services = null;

  try {
    // Capture services initialization
    try {
      services = await serviceManager.getServices();
      if (!services || !services.abTesting) {
        throw new Error("AB Testing service not initialized");
      }
    } catch (serviceError) {
      logger.error("Service initialization failed", {
        error: serviceError,
        serviceKeys: services ? Object.keys(services) : [],
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Service initialization failed",
          details:
            serviceError instanceof Error
              ? serviceError.message
              : "Unknown service error",
          context: {
            availableServices: services ? Object.keys(services) : [],
            hasABTesting: services?.abTesting ? "yes" : "no",
          },
          meta: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    try {
      rawBody = await req.text();
      const body = JSON.parse(rawBody);

      logger.debug("Received assignment request", {
        body,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      });

      const validatedData = await assignSchema.parseAsync(body);
      let testId = validatedData.testId;

      // Test lookup
      if (!testId && validatedData.testName) {
        const test = await services.abTesting.getTestByName(
          validatedData.testName
        );
        if (!test) {
          return NextResponse.json(
            {
              success: false,
              error: "Test not found",
              details: `No active test found with name: ${validatedData.testName}`,
              context: {
                providedName: validatedData.testName,
                suggestion: "Verify the test name or use testId instead",
              },
              meta: {
                took: Date.now() - startTime,
                timestamp: new Date().toISOString(),
              },
            },
            { status: 404 }
          );
        }
        testId = test.id;
      }

      if (!testId) {
        throw new Error("Test ID is required but not found");
      }

      // Variant assignment
      const assignment = await services.abTesting.assignVariant(
        validatedData.sessionId,
        testId
      );

      if (!assignment) {
        logger.warn("No eligible variant found", {
          testId,
          sessionId: validatedData.sessionId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "No eligible variant found",
            details: `No active variants available for test: ${testId}`,
            context: {
              testId,
              sessionId: validatedData.sessionId,
            },
            meta: {
              took: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        );
      }

      // Success path
      const latency = Date.now() - startTime;
      services.metrics.recordLatency("ab_test_assignment", "api", latency);
      services.metrics.incrementMetric("ab_test_assignment_success", {
        test_id: testId,
        variant_id: assignment.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          testId,
          variantId: assignment.id,
          weights: assignment.weights,
        },
        meta: {
          took: latency,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (processingError) {
      logger.error("Request processing failed", {
        error: processingError,
        rawBody,
        timestamp: new Date().toISOString(),
      });

      if (processingError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request parameters",
            details: processingError.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
              code: e.code,
            })),
            help: {
              example: {
                sessionId: "abc123",
                testId: "test-123",
                testName: "my-test-name",
              },
            },
            meta: {
              took: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        );
      }

      throw processingError; // Re-throw for general error handling
    }
  } catch (error) {
    logger.error("AB test assignment failed", {
      error,
      rawBody,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: "AB test assignment failed",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        context: {
          rawBody,
          stack: error instanceof Error ? error.stack : undefined,
        },
        meta: {
          took: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}
