import { VectorizationService } from "@/lib/cortex/services/vectorization";
import type { Services } from "@/lib/cortex/types/services";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { Client } from "@elastic/elasticsearch";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

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

vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    private body: string;
    url: string;
    nextUrl: URL;
    constructor(url: string, init?: { method: string; body?: string }) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.body = init?.body || "";
    }
    async text() {
      return this.body;
    }
    async json() {
      return this.body ? JSON.parse(this.body) : null;
    }
  },
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data,
    })),
  },
}));

describe("Document vectorization endpoints", () => {
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
      vectorization: mockVectorization,
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
      sync: {
        vectorizeDocument: vi.fn().mockResolvedValue({
          embeddings: new Array(3072).fill(0.1),
        }),
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

  describe("GET /api/documents/[id]/vectorize", () => {
    it("should return 400 when indexId is missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize"
      );
      const response = await GET(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Missing indexId parameter",
      });
    });

    it("should return 404 when index is not found", async () => {
      vi.mocked(prisma.index.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?indexId=test-index"
      );
      const response = await GET(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: "Index not found",
      });
    });

    it("should handle successful vectorization", async () => {
      mockFetch.mockImplementation((url) => {
        if (url.toString().includes("_doc")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                found: true,
                _source: {
                  content: "test content",
                  title: "test title",
                  embeddings: new Array(3072).fill(0.1),
                },
              }),
          } as unknown as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        } as unknown as Response);
      });

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?indexId=test-index"
      );
      const response = await GET(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          id: "123",
          index: "test-index",
          vectorized: true,
          embeddingsLength: 3072,
        },
      });
    });

    it("should handle document fetch failure", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({ error: "Failed to fetch document" }),
        } as unknown as Response)
      );

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?indexId=test-index"
      );
      const response = await GET(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to vectorize document",
        details: "Failed to fetch document",
      });
    });

    it("should handle vectorization failure", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              found: true,
              _source: {
                content: "test content",
                title: "test title",
              },
            }),
        } as unknown as Response)
      );

      vi.mocked(serviceManager.getServices).mockResolvedValue({
        sync: {
          vectorizeDocument: vi
            .fn()
            .mockRejectedValue(new Error("Vectorization failed")),
        },
      } as unknown as Services);

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?indexId=test-index"
      );
      const response = await GET(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to vectorize document",
        details: "Vectorization failed",
      });
    });
  });

  describe("PUT /api/documents/[id]/vectorize", () => {
    it("should handle missing required parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize",
        {
          method: "PUT",
          body: JSON.stringify({ title: "test" }),
        }
      );
      const response = await PUT(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Missing required parameters",
      });
    });

    it("should handle invalid JSON input", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?index=test-index",
        {
          method: "PUT",
          body: "invalid json{",
        }
      );

      const response = await PUT(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid JSON",
      });
    });

    it("should handle successful document update", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        } as unknown as Response)
      );

      const updateData = {
        title: "Updated Title",
        content: "Updated Content",
        tags: ["tag1", "tag2"],
      };

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?index=test-index",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          id: "123",
          index: "test-index",
          indexId: "test-index",
          updated: true,
          updatedFields: ["title", "content", "tags"],
        },
        meta: {
          timestamp: mockDate,
        },
      });
    });

    it("should handle document update failure", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({ error: "Failed to update document" }),
        } as unknown as Response)
      );

      const updateData = {
        title: "Updated Title",
        content: "Updated Content",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/documents/123/vectorize?index=test-index",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to update document",
        details: "Failed to update document",
      });
    });
  });
});
