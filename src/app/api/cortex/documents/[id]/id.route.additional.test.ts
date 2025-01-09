import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "./route";

// Mock dependencies
const mockServiceManager = {
  getServices: vi.fn(),
};

const mockPrisma = {
  index: {
    findUnique: vi.fn(),
  },
};

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock("@/lib/cortex/utils/service-manager", () => ({
  serviceManager: mockServiceManager,
}));

vi.mock("@/lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/shared/logger", () => ({
  default: mockLogger,
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Document [id] API Additional Tests", () => {
  const mockDate = new Date("2025-01-09T11:40:24.173Z").toISOString();
  const mockDateObj = new Date(mockDate);

  const mockVectorization = {
    vectorizeDocument: vi.fn().mockImplementation(async (doc) => ({
      ...doc,
      embeddings: [0.1, 0.2, 0.3],
      processing_status: "completed",
      created_at: mockDate,
      updated_at: mockDate,
    })),
  };

  const mockServices = {
    elasticsearch: {
      indexExists: vi.fn(),
    },
    vectorization: mockVectorization,
  };

  const mockIndex = {
    id: "test-index-id",
    name: "test-index",
    status: "active",
    settings: {},
    mappings: {},
    created_at: mockDateObj,
    updated_at: mockDateObj,
    deleted_at: null,
    doc_count: 0,
    size_bytes: 0,
    health: "green",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDateObj);
    vi.clearAllMocks();

    process.env.ELASTICSEARCH_URL = "http://localhost:9200";
    process.env.SOPHRA_ES_API_KEY = "test-key";

    mockServiceManager.getServices.mockResolvedValue(mockServices as any);
    mockPrisma.index.findUnique.mockResolvedValue(mockIndex);
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

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Invalid update data",
          details: expect.any(Object),
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
          details: "Document not found",
        });
      });

      it("should handle vectorization errors", async () => {
        mockVectorization.vectorizeDocument.mockRejectedValueOnce(
          new Error("Vectorization failed")
        );

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
