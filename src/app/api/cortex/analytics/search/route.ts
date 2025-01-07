import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody = null;
  let services = null;

  try {
    services = await serviceManager.getServices();

    if (!services.analytics) {
      logger.error("Analytics service not available");
      throw new Error("Analytics service not initialized");
    }

    rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const searchEvent = await services.analytics.createSearchEvent({
      query: body.query,
      searchType: body.searchType,
      totalHits: body.totalHits,
      took: body.took,
      timestamp: new Date(),
      facetsUsed: body.facets,
      sessionId: body.sessionId,
      resultIds: body.resultIds,
      filters: body.filters,
    });

    return NextResponse.json({
      success: true,
      data: {
        searchEvent: {
          query: body.query,
          searchType: body.searchType,
          totalHits: body.totalHits,
          took: body.took,
          timestamp: new Date().toISOString(),
          facetsUsed: body.facets,
          sessionId: body.sessionId,
          resultIds: body.resultIds,
          filters: body.filters,
        },
        meta: {
          took: Date.now() - startTime,
          service: "analytics",
          endpoint: "search",
        },
      },
    });
  } catch (error) {
    logger.error("Failed to log search analytics", {
      error,
      rawBody,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      serviceStatus: {
        available: services?.analytics ? true : false,
        services: services ? Object.keys(services) : [],
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to log search analytics",
        details: error instanceof Error ? error.message : "Unknown error",
        context: {
          rawBody,
          stack: error instanceof Error ? error.stack : undefined,
          serviceStatus: {
            available: services?.analytics ? true : false,
            services: services ? Object.keys(services) : [],
          },
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const startTime = Date.now();

    const analytics = await services.analytics.getSearchEvents({
      timeframe: from ? `${from}` : to ? `${to}` : undefined,
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        searchEvents: analytics.map((event) => ({
          id: event.id,
          query: event.query,
          searchType: event.searchType,
          totalHits: event.totalHits,
          took: event.took,
          timestamp: event.timestamp,
          sessionId: event.sessionId,
          facetsUsed: event.facetsUsed
            ? JSON.parse(event.facetsUsed.toString())
            : null,
        })),
        meta: {
          count: analytics.length,
          timeframe: {
            from: from || "beginning",
            to: to || "now",
          },
          took: Date.now() - startTime,
          limit: 100,
        },
      },
    });
  } catch (error) {
    logger.error("Failed to retrieve search analytics", { error });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve search analytics" },
      { status: 500 }
    );
  }
}
