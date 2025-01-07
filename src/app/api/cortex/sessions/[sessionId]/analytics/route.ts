import { serviceManager } from "@/lib/cortex/utils/service-manager";
import type { SearchEvent } from "@/lib/shared/database/validation/generated";
import logger from "@/lib/shared/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const sessionId = params.sessionId;

    // First verify the session exists
    const session = await services.sessions.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Use the analytics service instead of direct Prisma access
    const searchEvents = await services.analytics.getSearchEvents({
      sessionId,
      timeframe: "30d",
    });

    // Calculate session-specific metrics
    const metrics = {
      totalSearches: searchEvents.length,
      averageLatency: searchEvents.length
        ? searchEvents.reduce((sum, event) => sum + (event.took || 0), 0) /
          searchEvents.length
        : 0,
      clickThroughRate: calculateClickThroughRate(
        searchEvents as Partial<SearchEvent>[]
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        metrics,
        searchEvents: searchEvents.map((event) => ({
          timestamp: event.timestamp,
          query: event.query,
          totalHits: event.totalHits,
          took: event.took,
          searchType: event.searchType,
        })),
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

function calculateClickThroughRate(events: Partial<SearchEvent>[]): number {
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
