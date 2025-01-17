import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { JsonValue } from "@prisma/client/runtime/library";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Declare Node.js runtime
export const runtime = "nodejs";

interface SearchEventWithNullable {
  id: string;
  query: string;
  timestamp: Date;
  searchType: string;
  totalHits: number;
  took: number;
  facetsUsed?: JsonValue;
  sessionId?: string | null;
  resultIds?: JsonValue;
  filters?: JsonValue;
  page?: number;
  pageSize?: number;
}

interface RawSession {
  id: string;
  userId: string | null;
  startedAt?: string | Date;
  lastActiveAt?: string | Date;
  metadata?: unknown;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const sessionId = params.sessionId;

    // First verify the session exists
    const rawSession = (await services.sessions.getSession(
      sessionId
    )) as RawSession;
    if (!rawSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Get search analytics data
    let searchEvents: SearchEventWithNullable[] = [];
    try {
      searchEvents = (await services.analytics.getSearchEvents({
        sessionId,
        timeframe: "30d",
        limit: 100,
      })) as SearchEventWithNullable[];
    } catch (error) {
      logger.warn("Failed to fetch search analytics", { sessionId, error });
    }

    // If userId is null, try to fetch from database directly
    if (rawSession.userId === null) {
      try {
        const dbSession = await prisma.session.findUnique({
          where: { id: sessionId },
          select: { userId: true },
        });
        if (dbSession?.userId) {
          rawSession.userId = dbSession.userId;
          // Update Redis cache with correct userId
          await services.redis.set(
            `session:${rawSession.id}`,
            JSON.stringify({ ...rawSession, userId: dbSession.userId }),
            3600
          );
        }
      } catch (error) {
        logger.warn("Failed to fetch userId from database", {
          sessionId,
          error,
        });
      }
    }

    // Get username if we have a userId
    let username: string | null = null;
    if (rawSession.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: rawSession.userId },
          select: { name: true, email: true },
        });
        username = user?.name || user?.email || null;
      } catch (error) {
        logger.warn("Failed to fetch username", {
          userId: rawSession.userId,
          error,
        });
      }
    }

    const now = new Date();
    const startedAt = rawSession.startedAt
      ? new Date(rawSession.startedAt)
      : now;
    const lastActiveAt = rawSession.lastActiveAt
      ? new Date(rawSession.lastActiveAt)
      : now;
    const createdAt = rawSession.createdAt
      ? new Date(rawSession.createdAt)
      : now;
    const updatedAt = rawSession.updatedAt
      ? new Date(rawSession.updatedAt)
      : now;

    // Calculate analytics metrics
    const analytics = {
      totalSearches: searchEvents.length,
      averageLatency: searchEvents.length
        ? searchEvents.reduce((sum, event) => sum + (event.took || 0), 0) /
          searchEvents.length
        : 0,
      lastSearches: searchEvents.slice(0, 5).map((event) => ({
        timestamp: event.timestamp,
        query: event.query,
        totalHits: event.totalHits,
        took: event.took,
        searchType: event.searchType,
      })),
      searchTypes: searchEvents.reduce(
        (acc, event) => {
          if (event.searchType) {
            acc[event.searchType] = (acc[event.searchType] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      ),
      errorRate: searchEvents.length
        ? (searchEvents.filter((event) => event.totalHits === 0).length /
            searchEvents.length) *
          100
        : 0,
      clickThroughRate: calculateClickThroughRate(searchEvents),
    };

    return NextResponse.json({
      success: true,
      data: {
        id: rawSession.id,
        userId: rawSession.userId,
        username,
        startedAt,
        lastActiveAt,
        createdAt,
        updatedAt,
        metadata: rawSession.metadata || {},
        analytics,
        isActive: lastActiveAt > new Date(Date.now() - 30 * 60 * 1000), // Active if last active within 30 mins
        age: Date.now() - createdAt.getTime(),
        durationMinutes: Math.floor((Date.now() - startedAt.getTime()) / 60000),
      },
    });
  } catch (error) {
    logger.error("Failed to get session analytics", {
      error,
      sessionId: params.sessionId,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get session analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateClickThroughRate(events: SearchEventWithNullable[]): number {
  if (events.length === 0) return 0;
  const clickedEvents = events.filter(
    (event) =>
      event.filters &&
      typeof event.filters === "object" &&
      "userAction" in event.filters &&
      event.filters.userAction === "clicked"
  );
  return clickedEvents.length / events.length;
}
