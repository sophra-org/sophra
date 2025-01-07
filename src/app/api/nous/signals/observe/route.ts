import logger from "@/lib/shared/logger";
import { Prisma, SignalType } from "@prisma/client";
import { prisma } from "@/lib/shared/database/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const ObserveQuerySchema = z.object({
  source: z.string().optional(),
  type: z.enum(Object.values(SignalType) as [string, ...string[]]).optional(),
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  timeRange: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const source = url.searchParams.get("source");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status") as
      | "PENDING"
      | "PROCESSING"
      | "COMPLETED"
      | "FAILED"
      | null;
    const stats = await prisma.signal.groupBy({
      by: [
        Prisma.SignalScalarFieldEnum.source,
        Prisma.SignalScalarFieldEnum.type,
      ],
      where: {
        ...(source && { source }),
        ...(type && { type: type as SignalType }),
        ...(status && { processing: { status } }),
      },
      _count: {
        _all: true,
      },
      _min: {
        timestamp: true,
      },
      _max: {
        timestamp: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: stats.map((stat) => ({
        source: stat.source, // Access source field directly
        type: stat.type, // Access type field directly
        count: typeof stat._count === "object" ? (stat._count._all ?? 0) : 0,
        firstSeen: stat._min?.timestamp ?? null,
        lastSeen: stat._max?.timestamp ?? null,
      })),
    });
  } catch (error) {
    logger.error("Failed to fetch signal stats", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch signal stats" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const validation = ObserveQuerySchema.safeParse(body);

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

    const { source, type, status, timeRange } = validation.data;

    const where: Prisma.SignalWhereInput = {
      ...(source && { source }),
      ...(type && { type: type as SignalType }),
      ...(status && {
        metadata: {
          path: ["status"],
          equals: status,
        },
      }),
      ...(timeRange && {
        timestamp: {
          gte: new Date(timeRange.start),
          lte: new Date(timeRange.end),
        },
      }),
    };

    const [stats, timeline] = await Promise.all([
      prisma.signal.groupBy({
        by: ["source", "type"],
        where,
        _count: true,
        _min: {
          timestamp: true,
        },
        _max: {
          timestamp: true,
        },
      }),
      prisma.signal.groupBy({
        by: ["timestamp"],
        where,
        _count: true,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: stats.map((stat) => ({
          source: stat.source,
          type: stat.type,
          count: stat._count,
          firstSeen: stat._min?.timestamp,
          lastSeen: stat._max?.timestamp,
        })),
        timeline: timeline.map((point) => ({
          timestamp: point.timestamp,
          count: point._count,
        })),
      },
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to observe signals", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
            }
          : error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to observe signals" },
      { status: 500 }
    );
  }
}
