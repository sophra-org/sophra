import { Prisma, SignalType } from '@prisma/client';
import { prisma } from "../../../../lib/shared/database/client";
import logger from "../../../../lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SignalSchema } from "../../../../lib/shared/database/validation/generated";

// Declare Node.js runtime
export const runtime = "nodejs";

// Use the generated schema but make ID optional for creation
const SignalCreateSchema = SignalSchema.omit({ id: true });

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
    const source = url.searchParams.get("source");
    const type = url.searchParams.get("type");

    const where = {
      ...(source && { source }),
      ...(type && { type }),
    };

    const [signals, totalCount] = await Promise.all([
      prisma.signal.findMany({
        where: {
          ...(source && { source }),
          ...(type && { type: type as SignalType }),
        },
        orderBy: { timestamp: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.signal.count({
        where: {
          ...(source && { source }),
          ...(type && { type: type as SignalType }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: signals,
      metadata: {
        count: signals.length,
        page,
        pageSize,
        totalCount,
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
    const now = new Date();
    
    // Add default fields
    const dataWithDefaults = {
      ...body,
      createdAt: now,
      updatedAt: now,
      timestamp: body.timestamp ? new Date(body.timestamp) : now,
      processed: body.processed ?? false,
      manual: body.manual ?? false,
      processedAt: body.processedAt ? new Date(body.processedAt) : null,
      metadata: body.metadata ?? null,
      error: body.error ?? null,
      retries: body.retries ?? null,
      priority: body.priority ?? null,
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

    const { 
      type, 
      source, 
      value, 
      strength,
      priority,
      retries,
      manual,
      processed,
      processedAt,
      error,
      timestamp, 
      metadata 
    } = validation.data;

    const signal = await prisma.signal.create({
      data: {
        type,
        source,
        value: value as Prisma.InputJsonValue,
        strength,
        priority,
        retries,
        manual,
        processed,
        processedAt,
        error,
        timestamp: new Date(timestamp),
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: signal,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to create signal", { error });
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
}
