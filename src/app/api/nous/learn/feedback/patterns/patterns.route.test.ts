import logger from "@lib/shared/logger";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    searchParams: new URL(url).searchParams,
    json: vi.fn(),
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data,
    })),
  },
}));

vi.mock("@lib/shared/database/client", () => {
  const mockPrisma = {
    feedbackRequest: {
      findMany: vi.fn(),
      $queryRaw: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from "@lib/shared/database/client";
import { GET } from "./route";

describe("Feedback Patterns Route Handler", () => {
  const mockFeedback = [
    {
      id: "1",
      feedback: [
        {
          queryId: "q1",
          rating: 0.8,
          metadata: {
            userAction: "CLICK",
            engagementType: "CLICK",
          },
        },
      ],
      timestamp: new Date("2023-01-01T00:00:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe("GET /api/nous/learn/feedback/patterns", () => {
    it("should fetch patterns with default parameters", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(
        mockFeedback
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      expect(response).toBeDefined();
      expect(response.json).toBeDefined();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        patterns: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            query_id: expect.any(String),
            pattern_type: expect.any(String),
            confidence: expect.any(Number),
            metadata: expect.objectContaining({
              averageRating: expect.any(Number),
              uniqueQueries: expect.any(Number),
              actions: expect.any(Array),
              engagementTypes: expect.any(Array)
            }),
            timestamp: expect.any(String)
          })
        ]),
        meta: {
          timeframe: "24h",
          total: 1,
          took: expect.any(Number),
          generated_at: expect.any(String)
        }
      });
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      expect(response).toBeDefined();
      expect(response.json).toBeDefined();
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
      expect(data.meta.took).toBeGreaterThanOrEqual(0);
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle custom timeframe and limit", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(
        mockFeedback
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?timeframe=7d&limit=50"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meta.timeframe).toBe("7d");
      expect(prisma.feedbackRequest.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 50,
      });
    });

    it("should handle invalid timeframe parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?timeframe=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
      expect(data.details).toBeDefined();
      expect(data.meta.took).toBeGreaterThanOrEqual(0);
    });

    it("should handle invalid limit parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?limit=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
      expect(data.details).toBeDefined();
      expect(data.meta.took).toBeGreaterThanOrEqual(0);
    });

    it("should handle limit out of range", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?limit=1001"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
      expect(data.details).toBeDefined();
      expect(data.meta.took).toBeGreaterThanOrEqual(0);
    });

    it("should calculate confidence and metrics correctly", async () => {
      const mockFeedbackWithDuplicates = [
        {
          id: "1",
          feedback: [
            {
              queryId: "q1",
              rating: 0.8,
              metadata: {
                userAction: "CLICK",
                engagementType: "CLICK",
              },
            },
            {
              queryId: "q1",
              rating: 0.9,
              metadata: {
                userAction: "VIEW",
                engagementType: "VIEW",
              },
            },
          ],
          timestamp: new Date("2023-01-01T00:00:00.000Z"),
        },
      ];

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(
        mockFeedbackWithDuplicates
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patterns[0]).toEqual(
        expect.objectContaining({
          query_id: "1",
          pattern_type: "FEEDBACK",
          confidence: expect.any(Number),
          metadata: expect.objectContaining({
            averageRating: 0.85,
            uniqueQueries: 1,
            actions: ["CLICK", "VIEW"],
            engagementTypes: ["CLICK", "VIEW"],
          }),
          timestamp: expect.any(String),
        })
      );
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patterns).toEqual([]);
      expect(data.meta.total).toBe(0);
      expect(data.meta.took).toBeGreaterThanOrEqual(0);
      expect(data.meta.generated_at).toBeDefined();
    });
  });
});
