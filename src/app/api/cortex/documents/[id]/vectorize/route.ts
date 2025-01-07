import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import JSON5 from "json5";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const EMBEDDING_MODEL = "text-embedding-3-large";
const VECTOR_DIMENSIONS = 3072;

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

function sanitizeInput(rawBody: string): string {
  try {
    let sanitized = rawBody.trim().replace(/^\uFEFF/, "");

    sanitized = sanitized.replace(
      /("content":\s*")([\s\S]*?)(")/g,
      (_, start, content, end) => {
        return start + content.replace(/\n/g, "\\n").replace(/"/g, '\\"') + end;
      }
    );

    sanitized = sanitized
      .replace(/(['"]tags['"]:\s*\[)[^\]]+(\])/g, (match) => {
        return match.replace(/'/g, '"').replace(/\[([^\]]+)\]/, (_, items) => {
          const tags = items
            .split(",")
            .map((t: string) => `"${t.trim().replace(/["']/g, "")}"`);
          return `[${tags.join(",")}]`;
        });
      })
      .replace(/"authors":\s*"([^"]+)"/g, (_, authors) => {
        const authorArray = authors
          .split(",")
          .map((a: string) => `"${a.trim()}"`);
        return `"authors": [${authorArray.join(",")}]`;
      });

    sanitized = sanitized.replace(
      /[\u0000-\u0019]+(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$)/g,
      ""
    );

    return sanitized;
  } catch (error) {
    logger.error("Input sanitization failed", { error, originalBody: rawBody });
    throw new Error("Failed to sanitize input");
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody = null;
  let indexId: string | null = null;

  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    indexId = searchParams.get("indexId");

    logger.debug("Vectorization request details", {
      docId: params.id,
      indexId,
      url: req.url,
      params: Object.fromEntries(searchParams.entries()),
    });

    if (!indexId) {
      return NextResponse.json(
        { success: false, error: "Missing indexId parameter" },
        { status: 400 }
      );
    }

    const indexRecord = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!indexRecord) {
      return NextResponse.json(
        { success: false, error: "Index not found" },
        { status: 404 }
      );
    }

    const syncService = await services.sync;
    if (!syncService) {
      throw new Error("Sync service not initialized");
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

    const esData = await response.json();

    logger.debug("Direct ES response", {
      docId: formattedDocId,
      index: indexRecord.name,
      found: esData.found,
      responseFields: esData._source ? Object.keys(esData._source) : [],
    });

    if (!esData.found || !esData._source) {
      return NextResponse.json({
        success: true,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          context: {
            docId: params.id,
            index: indexRecord.name,
          },
        },
      });
    }

    const document = {
      ...esData._source,
      id: formattedDocId,
    } as BaseDocument;

    if (
      (!document.content || document.content.trim() === "") &&
      (!document.title || document.title.trim() === "") &&
      (!document.abstract || document.abstract.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Document missing required fields for vectorization",
          context: {
            docId: params.id,
            index: indexRecord.name,
            availableFields: Object.keys(document),
            fieldValues: {
              content:
                document.content === "" ? "empty string" : document.content,
              title: document.title === "" ? "empty string" : document.title,
              abstract:
                document.abstract === "" ? "empty string" : document.abstract,
            },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const documentToVectorize = {
      id: formattedDocId,
      title: document.title || "",
      content: document.content || "",
      abstract: document.abstract || "",
      authors: Array.isArray(document.authors) ? document.authors : [],
      source: document.source || "",
      tags: Array.isArray(document.tags) ? document.tags : [],
      metadata: {
        ...document.metadata,
        vectorization_attempt: new Date().toISOString(),
      },
      processing_status: "pending",
      created_at: document.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      embeddings: document.embeddings || [],
    } as unknown as BaseDocument;
    const documentWithIndex = {
      ...documentToVectorize,
      index: indexRecord.name,
    };
    const vectorizationResult = (await syncService.vectorizeDocument(
      documentWithIndex
    )) as unknown as BaseDocument & { embeddings: number[] };

    if (!vectorizationResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Vectorization failed",
          details: "No result returned from vectorization service",
          context: {
            docId: formattedDocId,
            index: indexRecord.name,
            document: {
              id: documentToVectorize.id,
              hasContent: !!documentToVectorize.content,
              contentLength: documentToVectorize.content?.length,
              hasTitle: !!documentToVectorize.title,
              hasAbstract: !!documentToVectorize.abstract,
            },
          },
          meta: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    logger.debug("Vectorization output", {
      docId: formattedDocId,
      vectorizedDocKeys: Object.keys(vectorizationResult),
      hasEmbeddings: !!vectorizationResult.embeddings,
      embeddingsLength: vectorizationResult.embeddings.length,
      embeddingsType: typeof vectorizationResult.embeddings,
      sampleEmbeddings: vectorizationResult.embeddings.slice(0, 5),
    });

    if (
      !vectorizationResult.embeddings ||
      !vectorizationResult.embeddings.length
    ) {
      throw new Error("Vectorization failed - no embeddings generated");
    }

    const updateResponse = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${indexRecord.name}/_doc/${formattedDocId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...documentToVectorize,
          embeddings: vectorizationResult.embeddings,
          processing_status: "completed",
          metadata: {
            ...documentToVectorize.metadata,
            last_vectorized: new Date().toISOString(),
            vector_dimensions: VECTOR_DIMENSIONS,
            vector_model: EMBEDDING_MODEL,
          },
          updated_at: new Date().toISOString(),
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
      index: indexRecord.name,
      result: updateResult.result,
    });

    const verifyResponse = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${indexRecord.name}/_doc/${formattedDocId}`,
      {
        headers: {
          Authorization: `ApiKey ${process.env.SOPHRA_ES_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const verifyData = await verifyResponse.json();

    logger.debug("Verification after update", {
      docId: formattedDocId,
      hasEmbeddings: !!verifyData._source?.embeddings,
      embeddingsLength: verifyData._source?.embeddings?.length,
      allFields: Object.keys(verifyData._source || {}),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: formattedDocId,
        index: indexRecord.name,
        vectorized: true,
        embeddingsLength: vectorizationResult.embeddings.length,
      },
    });
  } catch (error) {
    logger.error("Vectorization failed", {
      error,
      docId: params.id,
      indexId: indexId,
      errorDetails: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      rawBody,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Vectorization failed",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : typeof error,
        context: {
          docId: params.id,
          index: indexId,
          rawBody,
          stack: error instanceof Error ? error.stack : undefined,
          suggestion: "Check sync service configuration and document format",
        },
        meta: {
          took: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const startTime = Date.now();
  const services = await serviceManager.getServices();
  let rawBody = "";

  try {
    const { searchParams } = new URL(req.url);
    const indexId = searchParams.get("index");
    rawBody = await req.text();

    if (!params.id || !indexId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get index name from Prisma
    const indexRecord = await prisma.index.findUnique({
      where: { id: indexId },
    });

    if (!indexRecord) {
      return NextResponse.json(
        { success: false, error: "Index not found" },
        { status: 404 }
      );
    }

    // Sanitize and parse the body
    const sanitizedBody = sanitizeInput(rawBody);
    let body;

    try {
      body = JSON5.parse(sanitizedBody);
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
          details:
            parseError instanceof Error
              ? parseError.message
              : "JSON parsing failed",
          context: {
            receivedBody: rawBody,
            sanitizedBody,
            expectedFormat: UpdateDocumentSchema.shape,
          },
          meta: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const validationResult = UpdateDocumentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update data",
          details: validationResult.error.format(),
          help: {
            example: {
              title: "Optional title update",
              content: "Optional content update",
              abstract: "Optional abstract update",
              authors: ["Author 1", "Author 2"],
              tags: ["tag1", "tag2"],
              source: "source name",
              metadata: { optional: "data" },
            },
          },
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
      index: indexRecord.name,
      fields: Object.keys(updateFields),
    });

    const updateResponse = await fetch(
      `${process.env.ELASTICSEARCH_URL}/${indexRecord.name}/_update/${formattedDocId}`,
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
      index: indexRecord.name,
      result: updateResult.result,
      updatedFields: Object.keys(updateFields),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: formattedDocId,
        index: indexRecord.name,
        indexId,
        updated: true,
        updatedFields: Object.keys(updateFields),
      },
      meta: {
        took: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Document update failed", {
      error,
      documentId: params.id,
      errorDetails: error instanceof Error ? error.message : String(error),
      rawBody,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
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
