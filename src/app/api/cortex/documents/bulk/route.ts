import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";
import {
  ServiceManager,
  serviceManager,
} from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Declare Node.js runtime
export const runtime = "nodejs";


const BATCH_SIZE = 500;

// Define the document schema
const BulkDocumentSchema = z.object({
  title: z.string(),
  content: z.string(),
  abstract: z.string(),
  authors: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()),
  source: z.string(),
});

// Define the request schema
const BulkRequestSchema = z.object({
  index: z.string(),
  documents: z.array(BulkDocumentSchema),
  tableName: z.string().optional(), // Make tableName optional
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const services = (await serviceManager.getServices()) as Awaited<
      ReturnType<ServiceManager["getServices"]>
    >;
    const body = await req.json();

    // Validate request body
    const validationResult = BulkRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { index, documents } = validationResult.data;
    const tableName = validationResult.data.tableName || index; // Use index as tableName if not provided

    logger.debug("Bulk document creation request", {
      index,
      tableName,
      documentCount: documents.length,
    });

    const syncService = await services.sync.getSyncService();
    const results = [];

    // Add IDs to documents and process in batches
    const documentsWithIds = documents.map((doc) => ({
      ...doc,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    for (let i = 0; i < documentsWithIds.length; i += BATCH_SIZE) {
      const batch = documentsWithIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((doc) =>
          syncService.upsertDocument({
            index,
            id: doc.id,
            document: doc as BaseDocument,
            tableName,
          })
        )
      );
      results.push(...batchResults);

      logger.info(`Processed batch ${i / BATCH_SIZE + 1}`, {
        total: documentsWithIds.length,
        processed: Math.min(i + BATCH_SIZE, documentsWithIds.length),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        total: documents.length,
        documents: results.map((r) => ({ id: r.id })),
      },
    });
  } catch (error) {
    logger.error("Bulk document ingestion failed", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Bulk ingestion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
