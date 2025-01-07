import { describe, it, expect } from "vitest";
import type { APIResponse, CreateDocumentRequest, UpdateDocumentRequest, SearchRequest, DeleteDocumentRequest, HealthStatus } from "@/app/api/cortex/types";
import type { BaseDocument } from "@/lib/cortex/elasticsearch/types";

describe("APIResponse", () => {
  it("should create a successful response", () => {
    const response: APIResponse<string> = {
      success: true,
      data: "test data"
    };
    expect(response.success).toBe(true);
    expect(response.data).toBe("test data");
    expect(response.error).toBeUndefined();
  });

  it("should create an error response", () => {
    const response: APIResponse<never> = {
      success: false,
      error: "test error",
      details: { code: 500 }
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe("test error");
    expect(response.details).toEqual({ code: 500 });
  });
});

describe("Document Requests", () => {
  const mockDocument: Partial<BaseDocument> = {
    id: "test-id",
    title: "Test Document"
  };

  it("should validate CreateDocumentRequest structure", () => {
    const request: CreateDocumentRequest = {
      index: "test-index",
      id: "test-id",
      document: mockDocument,
      tableName: "test_table"
    };
    expect(request).toHaveProperty("index");
    expect(request).toHaveProperty("document");
    expect(request).toHaveProperty("tableName");
  });

  it("should validate UpdateDocumentRequest structure", () => {
    const request: UpdateDocumentRequest = {
      index: "test-index",
      id: "test-id",
      document: mockDocument,
      tableName: "test_table"
    };
    expect(request.id).toBeDefined();
    expect(request.index).toBeDefined();
    expect(request.document).toBeDefined();
    expect(request.tableName).toBeDefined();
  });

  it("should validate DeleteDocumentRequest structure", () => {
    const request: DeleteDocumentRequest = {
      index: "test-index",
      id: "test-id",
      tableName: "test_table"
    };
    expect(request).toHaveProperty("index");
    expect(request).toHaveProperty("id");
    expect(request).toHaveProperty("tableName");
  });
});

describe("SearchRequest", () => {
  it("should validate SearchRequest with minimal properties", () => {
    const request: SearchRequest = {
      index: "test-index",
      query: { match_all: {} }
    };
    expect(request.index).toBeDefined();
    expect(request.query).toBeDefined();
    expect(request.from).toBeUndefined();
    expect(request.size).toBeUndefined();
  });

  it("should validate SearchRequest with all properties", () => {
    const request: SearchRequest = {
      index: "test-index",
      query: { match: { field: "value" } },
      from: 0,
      size: 10,
      facets: {
        fields: ["category", "type"],
        size: 5
      },
      aggregations: {
        avg_score: {
          avg: {
            field: "score"
          }
        }
      }
    };
    expect(request.facets?.fields).toHaveLength(2);
    expect(request.aggregations).toBeDefined();
    expect(request.from).toBe(0);
    expect(request.size).toBe(10);
  });
});

describe("HealthStatus", () => {
  it("should validate HealthStatus structure without error", () => {
    const status: HealthStatus = {
      elasticsearch: true,
      postgres: true,
      redis: true,
      sync: true,
      timestamp: new Date().toISOString()
    };
    expect(status.elasticsearch).toBe(true);
    expect(status.postgres).toBe(true);
    expect(status.redis).toBe(true);
    expect(status.sync).toBe(true);
    expect(status.error).toBeUndefined();
  });

  it("should validate HealthStatus structure with error", () => {
    const status: HealthStatus = {
      elasticsearch: false,
      postgres: true,
      redis: true,
      sync: false,
      timestamp: new Date().toISOString(),
      error: "Connection failed"
    };
    expect(status.elasticsearch).toBe(false);
    expect(status.sync).toBe(false);
    expect(status.error).toBe("Connection failed");
  });
});
