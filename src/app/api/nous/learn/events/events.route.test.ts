import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/lib/shared/database/client";
import { GET } from "./route";
import { LearningEventType } from "@/lib/nous/types/learning";
import { NextRequest } from "next/server";

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
    id: "1",
    type: LearningEventType.SEARCH_PATTERN,
    timestamp: new Date("2023-01-01T00:00:00.000Z"),
    metadata: {},
    correlationId: "corr-1",
    sessionId: "sess-1",
    userId: "user-1",
    clientId: "client-1",
    environment: "test",
    version: "1.0.0",
    status: "COMPLETED",
    priority: 1,
    retryCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/nous/learn/events", () => {
    it("should fetch events with default parameters", async () => {
      const mockEvents = [mockEvent];

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockEvents);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockEvent]);
      expect(data.meta).toEqual({
        total: 1,
        timestamp: expect.any(String),
        limit: 100
      });
    });

    it("should handle filtering by type and date range", async () => {
      const mockEvents = [mockEvent];

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockEvents);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/events?type=SEARCH_PATTERN&startDate=2023-01-01T00:00:00Z&endDate=2023-12-31T23:59:59Z&limit=50"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockEvent]);
      expect(data.meta).toEqual({
        total: 1,
        timestamp: expect.any(String),
        limit: 50
      });
    });

    it("should handle invalid query parameters", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test

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
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/events");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Database connection failed");
      expect(data.meta.timestamp).toBeDefined();
    });

    it("should handle database query errors gracefully", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Query Error"));

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
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

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