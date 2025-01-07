import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
// Declare Node.js runtime
export const runtime = "nodejs";


export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    const indexId = searchParams.get("index");
    const id = searchParams.get("id");

    if (!indexId || !id) {
      return NextResponse.json(
        { success: false, error: "Missing index or id parameter" },
        { status: 400 }
      );
    }

    // Get the index name from Prisma using the index ID
    const indexRecord = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!indexRecord) {
      return NextResponse.json(
        { success: false, error: "Index not found" },
        { status: 404 }
      );
    }

    const esService = await services.elasticsearch;

    // Check index using the actual index name
    const indexExists = await esService.indexExists(indexRecord.name);

    // Try direct ES query with the actual index name
    const response = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${indexRecord.name}/_doc/${id}`,
      {
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const esData = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        indexExists,
        documentExists: esData.found,
        documentData: esData.found ? esData._source : null,
        index: indexRecord.name,
        indexId,
        id,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Document verification failed", { error });
    return NextResponse.json(
      { success: false, error: "Failed to verify document" },
      { status: 500 }
    );
  }
}
