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

    logger.info("Vectorization request received", {
      documentId: params.id,
      indexId,
    });

    if (!indexId) {
      logger.warn("Missing indexId parameter", { documentId: params.id });
      return NextResponse.json(
        {
          success: false,
          error: "Missing indexId parameter",
        },
        { status: 400 }
      );
    }

    // Get index details
    logger.debug("Fetching index details", { indexId });
    const index = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!index) {
      logger.error("Index not found", { indexId });
      return NextResponse.json(
        {
          success: false,
          error: "Index not found",
        },
        { status: 404 }
      );
    }

    // Fetch document from Elasticsearch
    logger.debug("Fetching document from Elasticsearch", {
      documentId: params.id,
      index: index.name,
    });
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
      logger.error("Failed to fetch document from Elasticsearch", {
        documentId: params.id,
        status: response.status,
      });
      throw new Error("Failed to fetch document");
    }

    const document = await response.json();
    logger.debug("Document retrieved", {
      documentId: params.id,
      documentExists: !!document,
    });

    const services = await serviceManager.getServices();

    // Get document text content
    const documentText =
      document._source.content || document._source.text || "";
    if (!documentText) {
      logger.error("Document has no text content", {
        documentId: params.id,
        index: index.name,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Document has no text content to vectorize",
        },
        { status: 400 }
      );
    }

    // Vectorize document using VectorizationService
    logger.info("Starting document vectorization", {
      documentId: params.id,
      index: index.name,
      textLength: documentText.length,
    });

    logger.debug("Generating embeddings", {
      documentId: params.id,
      textLength: documentText.length,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    const embeddings = await services.vectorization.generateEmbeddings(
      documentText,
      process.env.OPENAI_API_KEY || ""
    );

    logger.debug("Embeddings generated", {
      documentId: params.id,
      hasEmbeddings: !!embeddings,
      embeddingsType: typeof embeddings,
      isArray: Array.isArray(embeddings),
      length: Array.isArray(embeddings) ? embeddings.length : 0
    });

    // Verify embeddings before update
    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      logger.error("Invalid embeddings generated", {
        documentId: params.id,
        embeddings,
      });
      throw new Error("Failed to generate valid embeddings");
    }

    // Update document with embeddings using _update endpoint
    const updateResponse = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${index.name}/_update/${params.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doc: {
            embeddings,
            vectorized_at: new Date().toISOString(),
          },
          doc_as_upsert: true
        }),
      }
    );

    if (!updateResponse.ok) {
      const updateError = await updateResponse.json();
      logger.error("Failed to update document with embeddings", {
        documentId: params.id,
        status: updateResponse.status,
        error: updateError
      });
      throw new Error(`Failed to update document with embeddings: ${JSON.stringify(updateError)}`);
    }

    const updateResult = await updateResponse.json();
    logger.debug("Document update response", {
      documentId: params.id,
      updateResult
    });

    // Get updated document with embeddings
    logger.debug("Fetching updated document with embeddings", {
      documentId: params.id,
    });
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
      logger.error("Failed to fetch updated document", {
        documentId: params.id,
        status: updatedDoc.status,
      });
      throw new Error("Failed to fetch updated document");
    }

    const updatedDocument = await updatedDoc.json();
    const documentEmbeddings = updatedDocument._source.embeddings || [];
    const embeddingsLength = documentEmbeddings.length;
    const first100Chars =
      embeddingsLength > 0
        ? JSON.stringify(documentEmbeddings[0]).slice(0, 100)
        : null;

    logger.info("Vectorization completed successfully", {
      documentId: params.id,
      embeddingsLength,
      first100Chars,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        index: index.name,
        vectorized: true,
        embeddingsLength,
        first100Chars,
      },
    });
  } catch (error) {
    logger.error("Failed to vectorize document", {
      error: error instanceof Error ? error : new Error(String(error)),
      documentId: params.id,
      stack: error instanceof Error ? error.stack : undefined,
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
      error: error instanceof Error ? error : new Error(String(error)),
      documentId: params.id,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
