import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";
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
};

vi.mock("lib/cortex/utils/service-manager", () => ({
  serviceManager: mockServiceManager,
}));

vi.mock("lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("lib/shared/logger", () => ({
  default: mockLogger,
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Document [id] API Additional Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELASTICSEARCH_URL = "http://localhost:9200";
    process.env.SOPHRA_ES_API_KEY = "test-key";
  });

  const mockVectorization = {
    vectorizeDocument: vi.fn().mockImplementation(async (doc) => {
      return {
        ...doc,
        embeddings: [0.1, 0.2, 0.3],
        processing_status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }),
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
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    doc_count: 0,
    size_bytes: 0,
    health: "green",
  };

  beforeEach(() => {
    mockServiceManager.getServices.mockResolvedValue(mockServices as any);
    mockPrisma.index.findUnique.mockResolvedValue(mockIndex);
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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
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

        expect(response.status).toBe(500);
        expect(data).toMatchObject({
          success: false,
          error: expect.stringContaining("Failed to update document"),
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
        expect(data.success).toBe(true);
        expect(data.data.updated).toBe(true);
        expect(data.data.updatedFields).toEqual(
          expect.arrayContaining(Object.keys(validUpdateData))
        );
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
        expect(data.success).toBe(true);
        expect(data.data.updatedFields).toEqual(["title"]);
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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to process document");
      });

      it("should handle network errors", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to update document");
      });

      it("should vectorize document content during update", async () => {
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

        expect(mockVectorization.vectorizeDocument).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "test-id",
            title: validUpdateData.title,
            content: validUpdateData.content,
            abstract: validUpdateData.abstract,
            authors: validUpdateData.authors,
            metadata: expect.objectContaining({
              documentId: "test-id",
              index: "test-index",
            }),
            tags: validUpdateData.tags,
            source: validUpdateData.source,
          })
        );
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.updatedFields).toEqual(
          expect.arrayContaining(Object.keys(validUpdateData))
        );
      });

      it("should log vectorization errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        });
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

        expect(mockLogger.error).toHaveBeenCalledWith(
          "Vectorization failed",
          expect.objectContaining({
            error: expect.any(Error),
            docId: "test-id",
            hasApiKey: true,
          })
        );
        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to process document");
      });

      it("should handle vectorization errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "updated" }),
        });
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
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to process document");
      });
    });
  });

  describe("GET Endpoint", () => {
    describe("Parameter Validation", () => {
      it("should require id parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents?index=test-index"
        );

        const response = await GET(request, { params: { id: "" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
      });

      it("should require index parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents/test-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
      });
    });

    describe("Document Retrieval", () => {
      it("should retrieve document successfully", async () => {
        const mockDocument = {
          _source: {
            title: "Test Document",
            content: "Test content",
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockDocument),
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual({
          ...mockDocument._source,
          id: "test-id",
        });
      });

      it("should handle non-existent document", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.data).toBeNull();
      });

      it("should handle non-existent index", async () => {
        mockPrisma.index.findUnique.mockResolvedValue(null);

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Index not found");
      });
    });

    describe("Error Handling", () => {
      it("should handle Elasticsearch errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to retrieve document");
      });

      it("should handle network errors", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index-id"
        );

        const response = await GET(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to retrieve document");
      });
    });
  });

  describe("DELETE Endpoint", () => {
    describe("Parameter Validation", () => {
      it("should require id parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents?index=test-index",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
      });

      it("should require index parameter", async () => {
        const request = new NextRequest(
          "http://localhost/api/documents/test-id",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Missing required parameters");
      });
    });

    describe("Document Deletion", () => {
      it("should delete document successfully", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: "deleted" }),
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it("should handle non-existent document gracefully", async () => {
        mockFetch.mockResolvedValueOnce({
          status: 404,
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe("Error Handling", () => {
      it("should handle Elasticsearch errors", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to delete document");
      });

      it("should handle network errors", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const request = new NextRequest(
          "http://localhost/api/documents/test-id?index=test-index",
          {
            method: "DELETE",
          }
        );

        const response = await DELETE(request, { params: { id: "test-id" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to delete document");
      });
    });
  });
});
