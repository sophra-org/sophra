import { Prisma, SignalType as PrismaSignalType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../../../lib/shared/database/client";
import logger from "../../../../lib/shared/logger";
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Declare Node.js runtime
export const runtime = "nodejs";

const SignalType = z.nativeEnum(PrismaSignalType);

const SignalSchema = z.object({
  type: SignalType,
  source: z.string(),
  value: z.number(),
  strength: z.number(),
  priority: z.number(),
  retries: z.number(),
  manual: z.boolean(),
  processed: z.boolean(),
  processedAt: z.date(),
  error: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()),
});

const SignalCreateSchema = SignalSchema;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")));
    const source = url.searchParams.get("source");
    const type = url.searchParams.get("type");

    const [signals, totalCount] = await Promise.all([
      prisma.signal.findMany({
        where: {
          ...(source && { source }),
          ...(type && { type: type ? SignalType.parse(type) : undefined }),
        },
        orderBy: { timestamp: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.signal.count({
        where: {
          ...(source && { source }),
          ...(type && { type: type ? SignalType.parse(type) : undefined }),
        },
      }),
    ]);

    if (isNaN(page) || isNaN(pageSize)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters",
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signals,
      metadata: {
        count: signals.length,
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch signals", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch signals",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body is required",
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const timestamp = body.timestamp ? new Date(body.timestamp) : now;

    // Validate timestamp is not in the future
    if (timestamp > now) {
      return NextResponse.json(
        {
          success: false,
          error: "Timestamp cannot be in the future",
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Add default fields
    const dataWithDefaults = {
      ...body,
      createdAt: now,
      updatedAt: now,
      timestamp,
      processed: body.processed ?? false,
      manual: body.manual ?? false,
      processedAt: body.processedAt ? new Date(body.processedAt) : null,
      metadata: body.metadata ?? {},
      error: body.error ?? null,
      retries: body.retries ?? 0,
      priority: body.priority ?? 0,
    };

    const validation = SignalCreateSchema.safeParse(dataWithDefaults);

    if (!validation.success) {
      logger.error("Invalid signal creation request", {
        errors: validation.error.format(),
        received: dataWithDefaults,
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

    // Create signal with validated data
    try {
      const signal = await prisma.signal.create({
        data: {
          type: validation.data.type,
          source: validation.data.source,
          value: validation.data.value as Prisma.InputJsonValue,
          strength: validation.data.strength,
          priority: validation.data.priority,
          retries: validation.data.retries,
          manual: validation.data.manual,
          processed: validation.data.processed,
          processedAt: validation.data.processedAt,
          error: validation.data.error,
          timestamp: new Date(validation.data.timestamp),
          metadata: validation.data.metadata as Prisma.InputJsonValue,
        },
      });

      logger.info("Signal created successfully", { signalId: signal.id });

      return NextResponse.json({
        success: true,
        data: {
          ...signal,
          timestamp: signal.timestamp.toISOString(),
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      }, { status: 201 });
    } catch (error) {
      logger.error("Database error creating signal", { error });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create signal",
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Failed to process signal creation request", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
