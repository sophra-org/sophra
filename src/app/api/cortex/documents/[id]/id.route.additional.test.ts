import { VectorizationService } from "@/lib/cortex/services/vectorization";
import type { Services } from "@/lib/cortex/types/services";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { Client } from "@elastic/elasticsearch";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "./route";

vi.mock("@/lib/cortex/utils/service-manager", () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock("@/lib/shared/database/client", () => ({
  prisma: {
    index: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Document [id] API Additional Tests", () => {
  const mockDate = new Date("2025-01-09T11:40:24.173Z").toISOString();
  const mockDateObj = new Date(mockDate);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDateObj);
    vi.clearAllMocks();

    process.env.ELASTICSEARCH_URL = "http://localhost:9200";
    process.env.SOPHRA_ES_API_KEY = "test-key";

    const mockVectorization = new VectorizationService({ apiKey: "test-key" });
    const mockClient = {
      ping: vi.fn(),
      indices: {
        exists: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        stats: vi.fn(),
        getMapping: vi.fn(),
        putMapping: vi.fn(),
        getSettings: vi.fn(),
        putSettings: vi.fn(),
      },
      cluster: {
        health: vi.fn(),
      },
    } as unknown as Client;

    // Mock services with all required properties
    vi.mocked(serviceManager.getServices).mockResolvedValue({
      vectorization: {
        serviceName: "vectorization",
        log: vi.fn(),
        generateEmbeddings: vi.fn(),
        vectorizeDocument: vi.fn().mockImplementation(async (doc) => ({
          ...doc,
          embeddings: [0.1, 0.2, 0.3],
          processing_status: "completed",
          created_at: mockDate,
          updated_at: mockDate,
        })),
        vectorizeBatch: vi.fn(),
        checkHealth: vi.fn(),
      },
      elasticsearch: {
        client: mockClient,
        logger,
        requestQueue: {
          add: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
        indexExists: vi.fn().mockResolvedValue(true),
        createIndex: vi.fn(),
        deleteIndex: vi.fn(),
        documentExists: vi.fn().mockResolvedValue(true),
        getStats: vi.fn(),
        testService: vi.fn(),
        healthCheck: vi.fn(),
        disconnect: vi.fn(),
        initialize: vi.fn(),
        refreshIndex: vi.fn(),
        putMapping: vi.fn(),
        getMapping: vi.fn(),
        putSettings: vi.fn(),
        getSettings: vi.fn(),
        count: vi.fn(),
        scroll: vi.fn(),
        health: vi.fn(),
        ping: vi.fn(),
        upsertDocument: vi.fn(),
        getDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        search: vi.fn(),
        bulk: vi.fn(),
        bulkDelete: vi.fn(),
        bulkUpdate: vi.fn(),
        bulkUpsert: vi.fn(),
        deleteByQuery: vi.fn(),
        updateByQuery: vi.fn(),
        reindex: vi.fn(),
        analyze: vi.fn(),
        validateQuery: vi.fn(),
        explain: vi.fn(),
        fieldCaps: vi.fn(),
        termvectors: vi.fn(),
        mget: vi.fn(),
        msearch: vi.fn(),
        clearScroll: vi.fn(),
        countByQuery: vi.fn(),
        searchTemplate: vi.fn(),
        renderSearchTemplate: vi.fn(),
        scriptsPainless: vi.fn(),
        scriptsUpdate: vi.fn(),
        scriptsDelete: vi.fn(),
        scriptsGet: vi.fn(),
        scriptsList: vi.fn(),
        scriptsExecute: vi.fn(),
        aliases: vi.fn(),
        aliasExists: vi.fn(),
        createAlias: vi.fn(),
        deleteAlias: vi.fn(),
        updateAliases: vi.fn(),
        getAliases: vi.fn(),
      },
      documents: {
        createDocument: vi.fn(),
        getDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        listDocuments: vi.fn(),
        testService: vi.fn(),
      },
      health: {
        checkHealth: vi.fn(),
        getStatus: vi.fn(),
        testService: vi.fn(),
      },
    } as unknown as Services);

    vi.mocked(prisma.index.findUnique).mockResolvedValue({
      name: "test-index",
      id: "test-index-id",
      status: "active",
      settings: null,
      mappings: null,
      created_at: mockDateObj,
      updated_at: mockDateObj,
      deleted_at: null,
      doc_count: 0,
      size_bytes: 0,
      health: "green",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("PUT Endpoint", () => {
    const validUpdateData = {
      title: "Updated Title",
      content: "Updated content",
      abstract: "Updated abstract",
      authors: ["Author 1", "Author 2"],
      tags: ["tag1", "tag2"],
      source: "updated-source",
      metadata: {
        field1: "value1",
      },
    };

    describe("Parameter Validation", () => {
      it("should require id parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        const response = await PUT(request, { params: { id: "" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Missing required parameters",
        });
      });

      it("should require index parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents/test-id",
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Missing required parameters",
        });
      });

      it("should validate update data", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Invalid update data" }),
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify({
              invalidField: "value",
            }),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to process document",
          details: "Failed to update document in Elasticsearch",
        });
      });
    });

    describe("Document Update", () => {
      it("should update document successfully", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          data: {
            updated: true,
            documentId: "test-id",
            metadata: validUpdateData.metadata,
          },
        });
      });

      it("should format UUID-style document IDs", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        });

        const uuidStyle = "550e8400-e29b-41d4-a716-446655440000";
        const request = new NextRequest(
          `http://localhost/api/documents/${uuidStyle}?index=test-index`,
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        await PUT(request, { params: { id: uuidStyle } });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(uuidStyle),
          expect.any(Object)
        );
      });

      it("should handle partial updates", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        });

        const partialUpdate = {
          title: "Updated Title",
        };

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify(partialUpdate),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          data: {
            updated: true,
            documentId: "test-id",
            metadata: undefined,
          },
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle Elasticsearch errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Document not found" }),
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to process document",
          details: "Failed to update document in Elasticsearch",
        });
      });

      it("should handle vectorization errors", async () => {
        vi.mocked(serviceManager.getServices).mockResolvedValueOnce({
          vectorization: {
            serviceName: "vectorization",
            log: vi.fn(),
            generateEmbeddings: vi.fn(),
            vectorizeDocument: vi
              .fn()
              .mockRejectedValue(new Error("Vectorization failed")),
            vectorizeBatch: vi.fn(),
            checkHealth: vi.fn(),
          },
        } as unknown as Services);

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "PUT",
            body: JSON.stringify(validUpdateData),
          }
        );

        const response = await PUT(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to process document",
          details: "Vectorization failed",
        });
      });
    });
  });
});
