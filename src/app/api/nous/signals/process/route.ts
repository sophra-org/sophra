import { Prisma, SignalType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/shared/database/client";
import logger from "../../../../../lib/shared/logger";
// Declare Node.js runtime
export const runtime = "nodejs";


const ProcessUpdateSchema = z.object({
  signalId: z.string(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
  type: z.nativeEnum(SignalType),
  result: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      processingTime: z.number().optional(),
      processor: z.string().optional(),
      attemptCount: z.number().optional(),
      failureReason: z.string().optional(),
      processingSteps: z
        .array(
          z.object({
            step: z.string(),
            status: z.string(),
            duration: z.number(),
            timestamp: z.string().datetime(),
          })
        )
        .optional(),
      performance: z
        .object({
          cpuUsage: z.number().optional(),
          memoryUsage: z.number().optional(),
          latency: z.number().optional(),
        })
        .optional(),
      context: z
        .object({
          environment: z.string().optional(),
          version: z.string().optional(),
          batchId: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = ProcessUpdateSchema.safeParse(body);

    if (!validation.success) {
      logger.error("Invalid process update request", {
        errors: validation.error.format(),
        received: body,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { signalId, status, type, result, error, metadata } = validation.data;

    // First fetch the existing signal to preserve required fields
    const existingSignal = await prisma.signal.findUnique({
      where: { id: signalId },
    });

    if (!existingSignal) {
      return NextResponse.json(
        {
          success: false,
          error: "Signal not found",
          details: `No signal found with ID: ${signalId}`,
        },
        { status: 404 }
      );
    }

    // Merge metadata properly
    const updatedMetadata = {
      ...(existingSignal.metadata as Record<string, unknown>),
      ...(metadata || {}),
      status,
    };

    // Update the signal while preserving required fields
    const processing = await prisma.signal.update({
      where: { id: signalId },
      data: {
        processed: true,
        processedAt: new Date(),
        metadata: updatedMetadata as Prisma.InputJsonValue,
        error: error || undefined,
        updatedAt: new Date(),
        strength: existingSignal.strength,
        value: result ? (result as Prisma.InputJsonValue) : (existingSignal.value as Prisma.InputJsonValue),
      },
    });

    logger.info("Updated signal processing", {
      signalId,
      status,
      processed: processing.processed,
    });

    return NextResponse.json({
      success: true,
      data: processing,
    });
  } catch (error) {
    logger.error("Failed to update signal processing", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update signal processing",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const pending = await prisma.signal.findMany({
      where: {
        processed: status === "COMPLETED",
        metadata: {
          path: ["status"],
          equals: status || "PENDING",
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: pending,
      metadata: {
        count: pending.length,
        status,
        limit,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch pending signals", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending signals" },
      { status: 500 }
    );
  }
}
