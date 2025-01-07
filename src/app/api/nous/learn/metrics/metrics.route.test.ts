import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import prisma from "@/lib/shared/database/client";
import { GET } from "./route";

// Mock MetricType enum
const MetricType = {
  FEEDBACK_SCORE: "FEEDBACK_SCORE",
  ENGAGEMENT_RATE: "ENGAGEMENT_RATE",
  RELEVANCE_SCORE: "RELEVANCE_SCORE",
  CLICK_THROUGH: "CLICK_THROUGH",
  CONVERSION_RATE: "CONVERSION_RATE",
  SEARCH_LATENCY: "SEARCH_LATENCY",
  MODEL_ACCURACY: "MODEL_ACCURACY",
  ADAPTATION_SUCCESS: "ADAPTATION_SUCCESS",
} as const;

vi.mock("@prisma/client", () => ({
  MetricType: MetricType,
}));

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

vi.mock("@/lib/shared/database/client", () => ({
  default: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Learning Metrics Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe("GET /api/nous/learn/metrics", () => {
    it("should fetch metrics with valid parameters", async () => {
      const mockMetrics = [
        {
          id: "1",
          type: MetricType.FEEDBACK_SCORE,
          value: 0.85,
          timestamp: new Date("2023-01-01T11:00:00.000Z"),
          metadata: {},
          interval: "1h",
        },
        {
          id: "2",
          type: MetricType.ENGAGEMENT_RATE,
          value: 0.75,
          timestamp: new Date("2023-01-01T11:30:00.000Z"),
          metadata: {},
          interval: "1h",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE,ENGAGEMENT_RATE&timeframe=24h&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMetrics);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: "24h",
        interval: "1h",
        metrics_requested: ["FEEDBACK_SCORE", "ENGAGEMENT_RATE"],
        count: 2,
        took: expect.any(Number),
      });
    });

    it("should handle invalid metric types", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=INVALID_METRIC&timeframe=24h&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: null,
        interval: null,
        metrics_requested: [],
        count: 0,
        error: expect.stringContaining("Invalid metrics"),
        took: expect.any(Number),
      });
    });

    it("should handle invalid timeframe parameter", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE&timeframe=invalid&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: null,
        interval: null,
        metrics_requested: [],
        count: 0,
        error: expect.any(String),
        took: expect.any(Number),
      });
    });

    it("should handle invalid interval parameter", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE&timeframe=24h&interval=invalid&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: null,
        interval: null,
        metrics_requested: [],
        count: 0,
        error: expect.any(String),
        took: expect.any(Number),
      });
    });

    it("should handle database connection failure", async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("DB connection failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE&timeframe=24h&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: "24h",
        interval: "1h",
        metrics_requested: ["FEEDBACK_SCORE"],
        count: 0,
        error: "DB connection failed",
        took: expect.any(Number),
      });
    });

    it("should handle database query failure", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("Query failed"));

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE&timeframe=24h&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: "24h",
        interval: "1h",
        metrics_requested: ["FEEDBACK_SCORE"],
        count: 0,
        error: "Query failed",
        took: expect.any(Number),
      });
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE&timeframe=24h&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: "24h",
        interval: "1h",
        metrics_requested: ["FEEDBACK_SCORE"],
        count: 0,
        took: expect.any(Number),
      });
    });

    it("should handle multiple metrics and timeframes", async () => {
      const mockMetrics = [
        {
          id: "1",
          type: MetricType.FEEDBACK_SCORE,
          value: 0.85,
          timestamp: new Date("2023-01-01T11:00:00.000Z"),
          metadata: {},
          interval: "1h",
        },
        {
          id: "2",
          type: MetricType.RELEVANCE_SCORE,
          value: 0.9,
          timestamp: new Date("2023-01-01T11:30:00.000Z"),
          metadata: {},
          interval: "1h",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB connection test
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce(mockMetrics);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?metrics=FEEDBACK_SCORE,RELEVANCE_SCORE&timeframe=7d&interval=1h&include_metadata=true"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMetrics);
      expect(data.metadata).toEqual({
        generated_at: "2023-01-01T12:00:00.000Z",
        timeframe: "7d",
        interval: "1h",
        metrics_requested: ["FEEDBACK_SCORE", "RELEVANCE_SCORE"],
        count: 2,
        took: expect.any(Number),
      });
    });
  });
}); 