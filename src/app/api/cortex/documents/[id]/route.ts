import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


// Document update schema
const UpdateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  abstract: z.string().optional(),
  authors: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();
  const services = await serviceManager.getServices();

  try {
    const { searchParams } = new URL(req.url);
    const index = searchParams.get("index");
    const body = await req.json();

    if (!params.id || !index) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const validationResult = UpdateDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      logger.error("Validation error", {
        error: validationResult.error.format(),
        documentId: params.id
      });
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const updateFields = validationResult.data;
    const formattedDocId = params.id.includes("-")
      ? params.id
      : params.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

    logger.debug("Attempting document update", {
      docId: formattedDocId,
      index,
      fields: Object.keys(updateFields),
    });

    // Vectorize content if present
    if (validationResult.data.content) {
      try {
        await services.vectorization.vectorizeDocument({
          id: params.id,
          title: validationResult.data.title || '',
          content: validationResult.data.content,
          abstract: validationResult.data.abstract || '',
          authors: validationResult.data.authors || [],
          metadata: {
            documentId: params.id,
            index,
            ...validationResult.data.metadata
          },
          tags: validationResult.data.tags || [],
          source: validationResult.data.source || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processing_status: '',
          embeddings: [],
          evaluationScore: {
            actionability: 0,
            aggregate: 0,
            clarity: 0,
            credibility: 0,
            relevance: 0
          },
          evaluation_score: {
            actionability: 0,
            aggregate: 0,
            clarity: 0,
            credibility: 0,
            relevance: 0
          },
          type: ''
        });
      } catch (error) {
        logger.error("Vectorization failed", {
          error,
          documentId: params.id
        });
        return NextResponse.json(
          {
            success: false,
            error: "Failed to process document",
            details: error instanceof Error ? error.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    }

    const updateResponse = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index}/_update/${formattedDocId}`,
      {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doc: updateFields,
          doc_as_upsert: true,
          detect_noop: false,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      logger.error("ES update failed", {
        status: updateResponse.status,
        error: errorData,
      });
      throw new Error(`ES update failed: ${JSON.stringify(errorData)}`);
    }

    const updateResult = await updateResponse.json();

    logger.debug("Document update result", {
      docId: formattedDocId,
      index,
      result: updateResult.result,
      updatedFields: Object.keys(updateFields),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: formattedDocId,
        index,
        updated: true,
        updatedFields: Object.keys(updateFields),
      },
      meta: {
        took: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error("Document update failed", {
      error,
      documentId: params.id,
      errorDetails: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const indexId = searchParams.get("index");

    if (!params.id || !indexId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
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

    const formattedDocId = params.id.includes("-")
      ? params.id
      : params.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

    const response = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${indexRecord.name}/_doc/${formattedDocId}`,
      {
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: true,
            data: null,
            meta: {
              took: Date.now() - startTime,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 200 }
        );
      }
      const errorData = await response.json();
      logger.error("Elasticsearch error", {
        status: response.status,
        error: errorData
      });
      return NextResponse.json(
        {
          success: false,
          error: "Failed to retrieve document",
          details: errorData
        },
        { status: 500 }
      );
    }

    const documentData = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        ...documentData._source,
        id: formattedDocId,
      },
      meta: {
        took: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve document",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const index = searchParams.get("index");

    if (!params.id || !index) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const formattedDocId = params.id.includes("-")
      ? params.id
      : params.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

    const response = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index}/_doc/${formattedDocId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Even if document doesn't exist, consider it a successful deletion
    if (response.status === 404) {
      return NextResponse.json({
        success: true,
        meta: {
          took: Date.now() - startTime,
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Elasticsearch error: ${response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      meta: {
        took: Date.now() - startTime,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete document",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}
