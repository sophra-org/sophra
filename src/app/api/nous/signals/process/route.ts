import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { Prisma, SignalType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
          metadata: {
            processingDuration: 0,
            apiVersion: process.env.NEXT_PUBLIC_API_VERSION,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const { signalId, status, type, result, error, metadata } = validation.data;

    const processing = await prisma.signal.update({
      where: { id: signalId },
      data: {
        type,
        value: result as unknown as Prisma.InputJsonValue,
        processed: true,
        processedAt: new Date(),
        metadata: metadata as unknown as Prisma.InputJsonValue,
        error: error || null,
      },
    });

    logger.info("Updated signal processing", {
      signalId,
      status,
      processed: processing.processed,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: processing,
      metadata: {
        processingDuration: Date.now() - startTime,
        apiVersion: process.env.NEXT_PUBLIC_API_VERSION,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to update signal processing", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to update signal processing" },
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
