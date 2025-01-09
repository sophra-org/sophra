import { VectorizationService } from "@/lib/cortex/services/vectorization";
import type { Services } from "@/lib/cortex/types/services";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import { prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import type { Client } from "@elastic/elasticsearch";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

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
      return JSON.parse(this.body);
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

vi.mock("@/lib/cortex/services/vectorization", () => ({
  VectorizationService: vi.fn().mockImplementation((config) => ({
    serviceName: "vectorization",
    log: vi.fn(),
    generateEmbeddings: vi.fn(),
    vectorizeDocument: vi.fn().mockImplementation(async (doc) => ({
      ...doc,
      embeddings: [0.1, 0.2, 0.3],
      processing_status: "completed",
    })),
    vectorizeBatch: vi.fn(),
    checkHealth: vi.fn(),
  })),
}));

describe("Document API Routes", () => {
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
        deleteDocument: vi.fn().mockResolvedValue({
          success: true,
          meta: {
            took: 0,
          },
        }),
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

  describe("DELETE /api/cortex/documents/[id]", () => {
    it("should delete a document successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: "deleted" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/cortex/documents/123?index=test-index-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        meta: {
          took: expect.any(Number),
        },
      });
    });

    it("should handle already deleted document gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ result: "not_found" }),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/cortex/documents/123?index=test-index-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { id: "123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        meta: {
          took: expect.any(Number),
        },
      });
    });

    it("should handle missing parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/cortex/documents/",
        {
          method: "DELETE",
        }
      );

      // @ts-expect-error - Testing missing id parameter
      const response = await DELETE(request, { params: {} });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Missing required parameters",
      });
    });
  });
});
