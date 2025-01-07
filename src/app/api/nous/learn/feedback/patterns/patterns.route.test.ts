import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { mockPrisma } from "~/vitest.setup";

vi.mock("@/lib/shared/database/client", () => ({ default: mockPrisma }));

vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: (data: any, init?: { status?: number }) => ({
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data)
      })
    },
    NextRequest: class {
      url: string;
      nextUrl: URL;
      searchParams: URLSearchParams;

      constructor(url: string) {
        this.url = url;
        this.nextUrl = new URL(url);
        this.searchParams = new URL(url).searchParams;
      }
    }
  };
});

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

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
        {
          queryId: "q2",
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
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patterns).toBeDefined();
      expect(data.patterns.length).toBe(1);
      expect(data.metadata.timeframe).toBe("24h");
      expect(data.metadata.total_patterns).toBe(1);
      expect(data.metadata.took).toBeGreaterThanOrEqual(0);
      expect(data.metadata.generated_at).toBeDefined();
    });

    it("should handle custom timeframe and limit", async () => {
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns?timeframe=7d&limit=50"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.timeframe).toBe("7d");
      expect(vi.mocked(mockPrisma.feedbackRequest.findMany)).toHaveBeenCalledWith({
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

    it("should handle database errors gracefully", async () => {
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockRejectedValue(
        new Error("DB Error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Internal server error");
      expect(data.details).toBe("DB Error");
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

      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockFeedbackWithDuplicates);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patterns[0]).toEqual(expect.objectContaining({
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
      }));
    });

    it("should handle empty results", async () => {
      vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue([]);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/feedback/patterns"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.patterns).toEqual([]);
      expect(data.metadata.total_patterns).toBe(0);
      expect(data.metadata.took).toBeGreaterThanOrEqual(0);
      expect(data.metadata.generated_at).toBeDefined();
    });
  });
}); 