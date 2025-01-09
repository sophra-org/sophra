import { serviceManager } from "@lib/cortex/utils/service-manager";
import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const indexId = searchParams.get("indexId");

    if (!indexId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing indexId parameter",
        },
        { status: 400 }
      );
    }

    const index = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!index) {
      return NextResponse.json(
        {
          success: false,
          error: "Index not found",
        },
        { status: 404 }
      );
    }

    // Fetch document from Elasticsearch
    const response = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index.name}/_doc/${params.id}`,
      {
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch document");
    }

    const document = await response.json();
    const services = await serviceManager.getServices();

    // Vectorize document
    await services.sync.vectorizeDocument({
      id: params.id,
      index: index.name
    });

    // Get updated document with embeddings
    const updatedDoc = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index.name}/_doc/${params.id}`,
      {
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!updatedDoc.ok) {
      throw new Error("Failed to fetch updated document");
    }

    const updatedDocument = await updatedDoc.json();

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        index: index.name,
        vectorized: true,
        embeddingsLength: updatedDocument._source.embeddings?.length || 0,
      },
    });
  } catch (error) {
    logger.error("Failed to vectorize document", {
      error,
      documentId: params.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to vectorize document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const indexId = searchParams.get("index");

    if (!indexId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
        },
        { status: 400 }
      );
    }

    const index = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!index) {
      return NextResponse.json(
        {
          success: false,
          error: "Index not found",
        },
        { status: 404 }
      );
    }

    const updatedFields = Object.keys(body);

    // Update document in Elasticsearch
    const response = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index.name}/_doc/${params.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update document");
    }

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        index: index.name,
        indexId,
        updated: true,
        updatedFields,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to update document", {
      error,
      documentId: params.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
      {
        success: false,
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
