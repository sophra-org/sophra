import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    const timeWindow = searchParams.get("timeWindow") || "24h";

    const report = await services.analytics.generateReport(timeWindow);

    return NextResponse.json({
      success: true,
      data: report,
      meta: {
        timeWindow,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to generate analytics report", {
      error,
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate analytics report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
