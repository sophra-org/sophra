import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "./route";
import { LearningEventType } from "@/lib/nous/types/learning";
import { NextRequest } from "next/server";
import { mockPrisma } from "~/vitest.setup";

vi.mock("@prisma/client", () => ({
  LearningEventType,
}));

vi.mock("next/server", () => {
  const NextResponse = {
    json: (data: any, init?: { status?: number }) => {
      const response = {
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data)
      };
      return response;
    }
  };

  class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }

  return { NextResponse, NextRequest: MockNextRequest };
});

vi.mock("@/lib/shared/database/client", () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Learning Events Route Handler", () => {
  const mockEvent = {
    id: "test-1",
    type: "SEARCH_PATTERN" as const,
    priority: "HIGH" as const,
    timestamp: new Date(),
    processedAt: null,
    metadata: {},
    correlationId: "corr-1",
    sessionId: "sess-1",
    userId: "user-1",
    clientId: "client-1",
    environment: "test",
    version: "1.0.0",
    status: "PENDING" as const,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    retryCount: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/events", () => {
    it("should fetch events with default parameters", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([mockEvent]);
      vi.mocked(mockPrisma.learningEvent.count).mockResolvedValueOnce(1);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockEvent]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10
      });
    });

    it("should handle filtering by type and date range", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([mockEvent]);
      vi.mocked(mockPrisma.learningEvent.count).mockResolvedValueOnce(1);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events?type=SEARCH_PATTERN&startDate=2023-01-01&endDate=2023-12-31"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockEvent]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10
      });
    });
    it("should handle invalid query parameters", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([mockEvent]); // DB connection test

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events?type=INVALID_TYPE"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid query parameters");
      expect(data.details).toBeDefined();
    });

    it("should handle database connection failure", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockRejectedValueOnce(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
      expect(data.meta.timestamp).toBeDefined();
    });
    it("should handle database query errors gracefully", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([mockEvent]); // DB connection test
      vi.mocked(mockPrisma.learningEvent.findMany).mockRejectedValueOnce(new Error("Query Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.error).toBe("Failed to retrieve learning events");
      expect(data.meta).toEqual({
        timestamp: expect.any(String),
        errorType: "Error",
        total: 0,
        limit: 100
      });
    });
    it("should handle empty results", async () => {
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([mockEvent]); // DB connection test
      vi.mocked(mockPrisma.learningEvent.findMany).mockResolvedValueOnce([]);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.meta).toEqual({
        total: 0,
        timestamp: expect.any(String),
        limit: 100
      });
    });
  });
}); 