import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => {
  const NextResponse = {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data,
    })),
  };
  return {
    NextRequest: vi.fn().mockImplementation((url) => ({
      url,
      nextUrl: new URL(url),
      headers: new Headers(),
      searchParams: new URL(url).searchParams,
    })),
    NextResponse,
  };
});

vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    feedbackRequest: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import after mocks
import { prisma } from "@lib/shared/database/client";

describe("Feedback Patterns Route Handler", () => {
  const mockFeedbackRequest = {
    id: "pattern-1",
    timestamp: new Date("2025-01-09T11:40:24.173Z"),
    feedback: [
      {
        queryId: "q1",
        rating: 0.85,
        metadata: {
          userAction: "CLICK",
          engagementType: "CLICK",
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/feedback/patterns", () => {
    it("should fetch patterns with default parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([
        mockFeedbackRequest as any,
      ]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        patterns: [
          {
            query_id: "pattern-1",
            pattern_type: "FEEDBACK",
            timestamp: "2025-01-09T11:40:24.173Z",
            confidence: expect.any(Number),
            metadata: {
              actions: ["CLICK"],
              engagementTypes: ["CLICK"],
              averageRating: 0.85,
              totalFeedback: 1,
              uniqueQueries: 1,
            },
          },
        ],
        meta: {
          timeframe: "24h",
          total: 1,
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should handle database errors gracefully", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );

      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch feedback patterns",
        meta: {
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should handle custom timeframe and limit", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?timeframe=7d&limit=5"
      );

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([
        mockFeedbackRequest as any,
      ]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        patterns: [
          {
            query_id: "pattern-1",
            pattern_type: "FEEDBACK",
            timestamp: "2025-01-09T11:40:24.173Z",
            confidence: expect.any(Number),
            metadata: {
              actions: ["CLICK"],
              engagementTypes: ["CLICK"],
              averageRating: 0.85,
              totalFeedback: 1,
              uniqueQueries: 1,
            },
          },
        ],
        meta: {
          timeframe: "7d",
          total: 1,
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should handle invalid timeframe parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?timeframe=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid parameters",
        details: expect.any(Object),
        meta: {
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should handle invalid limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?limit=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid parameters",
        details: expect.any(Object),
        meta: {
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should handle limit out of range", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?limit=0"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid parameters",
        details: expect.any(Object),
        meta: {
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });

    it("should calculate confidence and metrics correctly", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([
        mockFeedbackRequest as any,
      ]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.patterns[0]).toEqual({
        query_id: "pattern-1",
        pattern_type: "FEEDBACK",
        timestamp: "2025-01-09T11:40:24.173Z",
        confidence: expect.any(Number),
        metadata: {
          actions: ["CLICK"],
          engagementTypes: ["CLICK"],
          averageRating: 0.85,
          totalFeedback: 1,
          uniqueQueries: 1,
        },
      });
    });

    it("should handle empty results", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        patterns: [],
        meta: {
          timeframe: "24h",
          total: 0,
          took: expect.any(Number),
          generated_at: expect.any(String),
        },
      });
    });
  });
});
