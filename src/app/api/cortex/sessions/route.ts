import type { Session } from "@/lib/cortex/types/session";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


function convertPrismaSession(prismaSession: {
  id: string;
  userId: string | null;
  startedAt: Date;
  lastActiveAt: Date;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Session {
  return {
    id: prismaSession.id,
    userId: prismaSession.userId || null,
    startedAt: prismaSession.startedAt,
    lastActiveAt: prismaSession.lastActiveAt,
    createdAt: prismaSession.createdAt,
    updatedAt: prismaSession.updatedAt,
    metadata: JSON.parse(JSON.stringify(prismaSession.metadata || {})),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const services = await serviceManager.getServices();

  try {
    const body = await req.json();

    logger.debug("Creating session with body:", { body });

    if (body.metadata && typeof body.metadata !== "object") {
      return NextResponse.json(
        { success: false, error: "Metadata must be an object" },
        { status: 400 }
      );
    }

    if (body.userId && typeof body.userId !== "string") {
      return NextResponse.json(
        { success: false, error: "User ID must be a string" },
        { status: 400 }
      );
    }

    const session = await services.sessions.createSession({
      userId: body.userId,
      metadata: body.metadata,
    });
    const convertedSession = {
      id: session.id,
      userId: session.userId,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      updatedAt: new Date()
    };
    const jsonSafeSession = {
      ...convertedSession,
      metadata: convertedSession.metadata || null,
    };
    await services.redis.set(
      `session:${convertedSession.id}`,
      JSON.stringify(jsonSafeSession),
      3600,
    );

    services.metrics.recordLatency(
      "session_creation",
      "api",
      Date.now() - startTime
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: convertedSession.id,
          ...convertedSession,
        },
        cached: true,
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Failed to create session", {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        body: req.body,
      });
    } else {
      logger.error("Failed to create session with unknown error type", {
        error,
      });
    }

    services.metrics.incrementSearchError({
      search_type: "session",
      index: "sessions",
      error_type: error instanceof Error ? error.name : "unknown",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    const session = await services.sessions.getSession(sessionId);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    logger.error("Failed to retrieve session", { error });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
