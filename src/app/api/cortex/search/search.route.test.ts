import { Services } from "@/lib/cortex/types/services";
import { serviceManager } from "@/lib/cortex/utils/service-manager";
import logger from "@/lib/shared/logger";
import { Client } from "@elastic/elasticsearch";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma } from "~/vitest.setup";
import { MockNextRequest } from "./__mocks__/next-server";
import { POST } from "./route";

vi.mock("@/lib/cortex/utils/service-manager", () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock("@/lib/shared/database/client", () => ({
  prisma: {
    searchEvent: {
      create: vi.fn().mockImplementation((data) => ({
        id: "event-1",
        query: data.data.query || "",
        timestamp: data.data.timestamp || new Date(),
        sessionId: data.data.sessionId || "",
        searchType: data.data.searchType || "",
        totalHits: data.data.totalHits || 0,
        took: data.data.took || 0,
        facetsUsed: data.data.facetsUsed || "",
        resultIds: data.data.resultIds || [],
        page: data.data.page || 0,
        pageSize: data.data.pageSize || 0,
        filters: data.data.filters || {},
        session: {
          id: "session-1",
          userId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })),
    },
    index: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/server", () => {
  return vi.importActual<typeof import("./__mocks__/next-server")>(
    "./__mocks__/next-server"
  );
});

describe("POST /api/cortex/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform text search successfully", async () => {
    const mockSearchResult = {
      hits: {
        hits: [{ _id: "1", _score: 0.8 }],
        total: { value: 1 },
      },
      took: 5,
      aggregations: {},
    };

    vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
      id: "test-index",
      name: "test-index",
      created_at: new Date(),
      updated_at: new Date(),
      status: "ACTIVE",
      settings: {},
      mappings: {},
      deleted_at: null,
      doc_count: 0,
      size_bytes: 0,
      health: "green",
    });

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
      indices: {
        exists: vi.fn().mockResolvedValue(true),
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

    const mockServices = {
      elasticsearch: {
        search: vi.fn().mockResolvedValue({
          hits: {
            hits: mockSearchResult.hits.hits,
            total: mockSearchResult.hits.total,
          },
          took: mockSearchResult.took,
          aggregations: mockSearchResult.aggregations,
        }),
        client: mockClient,
        logger,
        requestQueue: {
          add: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
        indexExists: vi.fn().mockResolvedValue(true),
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
      vectorization: {
        serviceName: "vectorization",
        log: vi.fn(),
        generateEmbeddings: vi.fn(),
        vectorizeDocument: vi.fn(),
        vectorizeBatch: vi.fn(),
        checkHealth: vi.fn(),
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
    };

    vi.mocked(serviceManager.getServices).mockResolvedValue(
      mockServices as unknown as Services
    );

    vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
      id: "event-1",
      query: "",
      timestamp: new Date(),
      sessionId: "",
      searchType: "",
      totalHits: 0,
      took: 0,
      facetsUsed: "",
      resultIds: [1, 2, 3],
      page: 0,
      pageSize: 0,
      filters: {},
    });

    const validBody = {
      index: "test-index",
      searchType: "text",
      textQuery: {
        query: "test query",
        fields: ["title", "content"],
        operator: "AND",
        fuzziness: "AUTO",
      },
      size: 10,
      from: 0,
    };

    const request = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request as unknown as NextRequest);
    const responseData = await response.json();

    console.log("Response data:", responseData);

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.hits).toEqual(mockSearchResult.hits.hits);
  });

  it("should perform vector search successfully", async () => {
    const mockSearchResult = {
      hits: {
        hits: [{ _id: "1", _score: 0.9 }],
        total: { value: 1 },
      },
      took: 3,
      aggregations: {},
    };

    vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
      id: "test-index",
      name: "test-index",
      created_at: new Date(),
      updated_at: new Date(),
      status: "ACTIVE",
      settings: {},
      mappings: {},
      deleted_at: null,
      doc_count: 0,
      size_bytes: 0,
      health: "green",
    });

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
      indices: {
        exists: vi.fn().mockResolvedValue(true),
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

    const mockServices = {
      elasticsearch: {
        search: vi.fn().mockResolvedValue({
          hits: {
            hits: mockSearchResult.hits.hits,
            total: mockSearchResult.hits.total,
          },
          took: mockSearchResult.took,
          aggregations: mockSearchResult.aggregations,
        }),
        client: mockClient,
        logger,
        requestQueue: {
          add: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
        indexExists: vi.fn().mockResolvedValue(true),
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
      vectorization: {
        serviceName: "vectorization",
        log: vi.fn(),
        generateEmbeddings: vi.fn(),
        vectorizeDocument: vi.fn(),
        vectorizeBatch: vi.fn(),
        checkHealth: vi.fn(),
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
    };

    vi.mocked(serviceManager.getServices).mockResolvedValue(
      mockServices as unknown as Services
    );

    vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
      id: "event-2",
      query: "",
      timestamp: new Date(),
      sessionId: "",
      searchType: "",
      totalHits: 0,
      took: 0,
      facetsUsed: "",
      resultIds: [1, 2, 3],
      page: 0,
      pageSize: 0,
      filters: {},
    });

    const vector = new Array(3072).fill(0.1);
    const validBody = {
      index: "test-index",
      searchType: "vector",
      vectorQuery: {
        vector,
        field: "embeddings",
        minScore: 0.7,
      },
      size: 10,
      from: 0,
    };

    const request = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request as unknown as NextRequest);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.hits).toEqual(mockSearchResult.hits.hits);
  });

  it("should handle faceted search correctly", async () => {
    const mockSearchResult = {
      hits: {
        hits: [{ _id: "1", _score: 0.8 }],
        total: { value: 1 },
      },
      took: 4,
      aggregations: {
        category: {
          buckets: [{ key: "technology", doc_count: 5 }],
        },
      },
    };

    vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
      id: "test-index",
      name: "test-index",
      created_at: new Date(),
      updated_at: new Date(),
      status: "ACTIVE",
      settings: {},
      mappings: {},
      deleted_at: null,
      doc_count: 0,
      size_bytes: 0,
      health: "green",
    });

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
      indices: {
        exists: vi.fn().mockResolvedValue(true),
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

    const mockServices = {
      elasticsearch: {
        search: vi.fn().mockResolvedValue({
          hits: {
            hits: mockSearchResult.hits.hits,
            total: mockSearchResult.hits.total,
          },
          took: mockSearchResult.took,
          aggregations: mockSearchResult.aggregations,
        }),
        client: mockClient,
        logger,
        requestQueue: {
          add: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
        indexExists: vi.fn().mockResolvedValue(true),
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
      vectorization: {
        serviceName: "vectorization",
        log: vi.fn(),
        generateEmbeddings: vi.fn(),
        vectorizeDocument: vi.fn(),
        vectorizeBatch: vi.fn(),
        checkHealth: vi.fn(),
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
    };

    vi.mocked(serviceManager.getServices).mockResolvedValue(
      mockServices as unknown as Services
    );

    vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
      id: "event-3",
      query: "",
      timestamp: new Date(),
      sessionId: "",
      searchType: "",
      totalHits: 0,
      took: 0,
      facetsUsed: "",
      resultIds: [1, 2, 3],
      page: 0,
      pageSize: 0,
      filters: {},
    });

    const validBody = {
      index: "test-index",
      searchType: "text",
      textQuery: {
        query: "test",
        fields: ["title"],
      },
      facets: {
        fields: ["category"],
        size: 5,
      },
      size: 10,
      from: 0,
    };

    const request = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request as unknown as NextRequest);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.data.aggregations).toEqual(
      mockSearchResult.aggregations
    );
  });

  it("should return 500 for invalid vector dimensions", async () => {
    const mockClient = {
      search: vi.fn(),
      indices: {
        exists: vi.fn().mockResolvedValue(true),
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

    const mockServices = {
      elasticsearch: {
        search: vi.fn(),
        client: mockClient,
        logger,
        requestQueue: {
          add: async <T>(fn: () => Promise<T>): Promise<T> => fn(),
        },
        indexExists: vi.fn().mockResolvedValue(true),
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
      vectorization: {
        serviceName: "vectorization",
        log: vi.fn(),
        generateEmbeddings: vi.fn(),
        vectorizeDocument: vi.fn(),
        vectorizeBatch: vi.fn(),
        checkHealth: vi.fn(),
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
    };

    vi.mocked(serviceManager.getServices).mockResolvedValue(
      mockServices as unknown as Services
    );

    const invalidBody = {
      index: "test-index",
      searchType: "vector",
      vectorQuery: {
        vector: [0.1, 0.2], // Invalid dimension
        field: "embeddings",
      },
      size: 10,
      from: 0,
    };

    const request = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify(invalidBody),
    });

    const response = await POST(request as unknown as NextRequest);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe("Search failed");
  });
});
