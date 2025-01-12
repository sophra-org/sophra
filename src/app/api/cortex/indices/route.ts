  import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const VECTOR_DIMENSIONS = 3072;

const DEFAULT_INDEX_MAPPING = {
  dynamic: false,
  properties: {
    title: { type: "text" },
    content: { type: "text" },
    abstract: { type: "text" },
    authors: { type: "keyword" },
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

const IndexCreationSchema = z.object({
  name: z.string(),
  settings: z
    .object({
      number_of_shards: z.number().default(1),
      number_of_replicas: z.number().default(1),
    })
    .optional(),
  mappings: z.record(z.any()).optional(),
});

type IndexCreationRequest = z.infer<typeof IndexCreationSchema>;

const formatBytes = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)}${units[unitIndex]}`;
};

export async function GET(): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    logger.info("Attempting to list indices...");
    const indices = await services.elasticsearch.listIndices();
    
    logger.info("Raw indices response:", { indices });
    
    if (!indices || indices.length === 0) {
      logger.info("No indices found in response");
      return NextResponse.json({
        success: true,
        data: {
          indices: [],
          stats: {
            totalIndices: 0,
            totalDocuments: 0,
            size: "0.00B",
            health: "green"
          },
          details: []
        }
      });
    }

    logger.info(`Found ${indices.length} indices`);

    const response = {
      success: true,
      data: {
        indices: indices.map(idx => idx.name),
        stats: {
          totalIndices: indices.length,
          totalDocuments: indices.reduce(
            (sum, idx) => sum + idx.docsCount,
            0
          ),
          size: formatBytes(
            indices.reduce((sum, idx) => {
              const sizeInBytes = parseInt(idx.storeSize);
              return sum + (isNaN(sizeInBytes) ? 0 : sizeInBytes);
            }, 0)
          ),
          health: indices.every(idx => idx.health === "green")
            ? "green"
            : "yellow",
        },
        details: indices,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Failed to get indices", { error });
    return NextResponse.json(
      { success: false, error: "Failed to get indices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let requestBody: IndexCreationRequest = { name: "unknown" };

  try {
    const services = await serviceManager.getServices();
    const rawBody = await req.json();

    // Validate the request body
    const validation = IndexCreationSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    requestBody = validation.data;

    // Check if index exists first
    const indexExists = await services.elasticsearch.indexExists(
      requestBody.name
    );

    if (indexExists) {
      logger.info("Index already exists, returning success", {
        index: requestBody.name,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Index already exists",
          data: {
            name: requestBody.name,
            status: "exists",
          },
        },
        { status: 200 }
      );
    }

    // Create new index if it doesn't exist
    const indexId = await prisma.index.create({
      data: {
        name: requestBody.name,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await services.elasticsearch.createIndex(requestBody.name, {
      body: {
        settings: requestBody.settings || {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
        mappings: requestBody.mappings || DEFAULT_INDEX_MAPPING,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: indexId.id,
        name: requestBody.name,
        status: "created",
        settings: requestBody.settings || {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
        mappings: requestBody.mappings || DEFAULT_INDEX_MAPPING,
        createdAt: new Date().toISOString(),
        health: "green",
        docsCount: 0,
        sizeInBytes: 0,
      },
    });
  } catch (error) {
    const services = await serviceManager.getServices();
    logger.error("Failed to create index", { error });

    if (error instanceof Error) {
      services.metrics.incrementIndexError({
        error_type: error.name,
        index: requestBody?.name || "unknown",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create index",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const services = await serviceManager.getServices();
    const { searchParams } = new URL(req.url);
    const index = searchParams.get("index");

    if (!index) {
      return NextResponse.json(
        { success: false, error: "Missing index parameter" },
        { status: 400 }
      );
    }

    await services.elasticsearch.deleteIndex(index);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete index", { error });
    return NextResponse.json(
      { success: false, error: "Failed to delete index" },
      { status: 500 }
    );
  }
}
