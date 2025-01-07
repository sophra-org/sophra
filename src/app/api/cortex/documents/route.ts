import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { CircuitBreaker } from "@/lib/shared/circuit-breaker";
import logger from "@/lib/shared/logger";
import { OperationQueue } from "@/lib/shared/queue";
import JSON5 from "json5";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const VECTOR_DIMENSIONS = 3072;

const DocumentSchema = z.object({
  index: z.string(),
  document: z.object({
    title: z.string(),
    content: z.string(),
    abstract: z.string(),
    authors: z.array(z.string()),
    metadata: z.record(z.unknown()).optional(),
    tags: z.array(z.string()),
    source: z.string(),
    embeddings: z.array(z.number()).optional(),
  }),
});

const DEFAULT_MAPPING = {
  dynamic: false,
  properties: {
    title: { type: "text" },
    content: { type: "text" },
    abstract: { type: "text" },
    authors: { type: "keyword" },
    source: { type: "keyword" },
    tags: { type: "keyword" },
    metadata: { type: "object" },
    embeddings: {
      type: "dense_vector",
      dims: VECTOR_DIMENSIONS,
      index: true,
      similarity: "cosine",
      index_options: {
        type: "hnsw",
        m: 16,
        ef_construction: 100,
      },
    },
    processing_status: { type: "keyword" },
    created_at: { type: "date" },
    updated_at: { type: "date" },
  },
};

function sanitizeInput(rawBody: string): string {
  try {
    // First, normalize newlines and remove any BOM
    let sanitized = rawBody.trim().replace(/^\uFEFF/, "");

    // Handle the content field's newlines specifically
    sanitized = sanitized.replace(
      /("content":\s*")([\s\S]*?)(")/g,
      (_, start, content, end) => {
        return (
          start +
          content
            .replace(/\r\n|\r|\n/g, "\\n") // Handle all newline variants
            .replace(/"/g, '\\"') +
          end
        );
      }
    );

    // Convert single quoted arrays to double quotes and fix array syntax
    sanitized = sanitized
      // Fix tags array
      .replace(/(['"]tags['"]:\s*\[)[^\]]+(\])/g, (match) => {
        return match.replace(/'/g, '"').replace(/\[([^\]]+)\]/, (_, items) => {
          const tags = items
            .split(",")
            .map((t: string) => `"${t.trim().replace(/["']/g, "")}"`);
          return `[${tags.join(",")}]`;
        });
      })
      // Fix authors string to array
      .replace(/"authors":\s*"([^"]+)"/g, (_, authors) => {
        const authorArray = authors
          .split(",")
          .map((a: string) => `"${a.trim()}"`);
        return `"authors": [${authorArray.join(",")}]`;
      });

    // Remove any remaining problematic characters outside of strings
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

// Initialize queues
const indexQueue = new OperationQueue({
  maxConcurrent: 2,
  maxQueueSize: 20,
  timeout: 30000,
  name: "Index Operations",
});

const documentQueue = new OperationQueue({
  maxConcurrent: 10,
  maxQueueSize: 100,
  timeout: 10000,
  name: "Document Operations",
});

// Initialize circuit breakers
const elasticsearchBreakers = {
  write: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    name: "Elasticsearch Write",
  }),
  index: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 45000,
    name: "Elasticsearch Index",
  }),
};

const syncBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 20000,
  name: "Sync Service",
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let rawBody = "";

  try {
    const services = await serviceManager.getServices();
    rawBody = await req.text();

    // Sanitize before parsing
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
            sanitizedBody, // Add this to see the sanitized version
            expectedFormat: {
              index: "string",
              document: {
                title: "string",
                content: "string",
                abstract: "string",
                authors: "string[]",
                tags: "string[]",
                source: "string",
                metadata: "object (optional)",
                embeddings: "number[] (optional)",
              },
            },
          },
          meta: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Enhanced validation with detailed feedback
    const validationResult = DocumentSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
        expected: issue.message.includes("Required")
          ? "required"
          : (DocumentSchema.shape as any)[issue.path[0]]?.description ||
            "unknown",
      }));

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: {
            errors: formattedErrors,
            receivedStructure: JSON.stringify(body, null, 2),
          },
          help: {
            example: {
              index: "my_index",
              document: {
                title: "Sample Document",
                content: "Document content here",
                abstract: "Brief summary",
                authors: ["Author 1", "Author 2"],
                tags: ["tag1", "tag2"],
                source: "internal",
                metadata: { optional: "data" },
                embeddings: [0.1, 0.2, 0.3],
              },
            },
          },
          meta: {
            took: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const { index, document } = validationResult.data;
    const tableName = index;

    // Check if index exists and handle index creation through queue
    const indexExists = await elasticsearchBreakers.index.execute(
      async () => await services.elasticsearch.indexExists(index)
    );

    if (!indexExists) {
      try {
        await indexQueue.add(async () => {
          await elasticsearchBreakers.index.execute(async () => {
            await services.elasticsearch.createIndex(index, {
              body: {
                settings: {
                  number_of_shards: 1,
                  number_of_replicas: 1,
                },
                mappings: DEFAULT_MAPPING,
              },
            });
          });
        });
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.includes("already exists")
        ) {
          throw error;
        }
      }
    }

    // Queue document processing
    const metadata = await documentQueue.add(async () => {
      return await syncBreaker.execute(async () => {
        return await services.sync.upsertDocument({
          index,
          id: crypto.randomUUID(),
          document: document as BaseDocument,
          tableName,
        });
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: metadata.id,
        index,
        created: true,
        document: {
          ...document,
          id: metadata.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processing_status: "pending",
        },
      },
      meta: {
        took: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        queueStats: {
          documentQueue: documentQueue.getStats(),
          indexQueue: indexQueue.getStats(),
        },
      },
    });
  } catch (error) {
    logger.error("Failed to create document", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      body: rawBody,
      queueStats: {
        documentQueue: documentQueue.getStats(),
        indexQueue: indexQueue.getStats(),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create document",
        details: error instanceof Error ? error.message : "Unknown error",
        meta: {
          took: Date.now() - startTime,
          requestId: crypto.randomUUID(),
        },
      },
      { status: 500 }
    );
  }
}

function validateAgainstMapping(document: any, mapping: any) {
  const mismatches = [];
  const suggestions: string[] = [];

  // Extract the actual mapping properties, handling the index-wrapped structure
  const properties =
    mapping[Object.keys(mapping)[0]]?.mappings?.properties ||
    mapping?.properties ||
    {};

  for (const [field, value] of Object.entries(document)) {
    const expectedType = properties[field]?.type;
    if (!expectedType) {
      mismatches.push({
        field,
        error: "Field not found in mapping",
        received: typeof value,
        suggestion: `Remove field or update mapping to include '${field}'`,
      });
      continue;
    }

    const actualType = getElasticsearchType(value);
    if (!isCompatibleType(actualType, expectedType)) {
      mismatches.push({
        field,
        error: "Type mismatch",
        expected: expectedType,
        received: actualType,
        value: value,
        suggestion: `Convert ${field} to ${expectedType}`,
      });
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
    suggestions,
  };
}

function isCompatibleType(actual: string, expected: string): boolean {
  // Handle special cases and type compatibility
  if (expected === "text" && actual === "string") return true;
  if (expected === "keyword" && actual === "string") return true;
  if (expected === "keyword" && Array.isArray(actual)) return true;
  if (expected === "object" && typeof actual === "object") return true;
  return actual === expected;
}

function getElasticsearchType(value: any): string {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) return "dense_vector";
    return "keyword";
  }
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "float";
    case "object":
      return "object";
    default:
      return typeof value;
  }
}

function classifyAndFormatError(error: any, startTime: number) {
  const baseResponse = {
    success: false,
    meta: {
      took: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };

  if (error instanceof Error) {
    if (error.message.includes("parse error")) {
      return {
        status: 400,
        body: {
          ...baseResponse,
          error: "JSON Parse Error",
          details: error.message,
          location: error.stack?.split("\n")[1]?.trim(),
          help: "Check your JSON syntax",
        },
      };
    }

    if (error.message.includes("mapping")) {
      return {
        status: 400,
        body: {
          ...baseResponse,
          error: "Mapping Error",
          details: error.message,
          problematicFields: extractProblematicFields(error.message),
          help: "Ensure your document structure matches the index mapping",
        },
      };
    }

    // Add more specific error classifications as needed
  }

  return {
    status: 500,
    body: {
      ...baseResponse,
      error: "Internal Server Error",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
      type: error instanceof Error ? error.name : typeof error,
    },
  };
}

function extractProblematicFields(errorMessage: string): string[] {
  // Extract field names from common Elasticsearch mapping error messages
  const fieldMatch = errorMessage.match(/field \[(.*?)\]/g);
  return fieldMatch
    ? fieldMatch.map((f) => f.replace("field [", "").replace("]", ""))
    : [];
}
