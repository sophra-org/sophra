import { MetricType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, runtime } from "./route";

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
    learningMetric: {
      findMany: vi.fn(),
      count: vi.fn(),
      $queryRaw: vi.fn(),
    },
  },
}));

// Import after mocks
import { prisma } from "@lib/shared/database/client";

describe("Learning Metrics Route Handler", () => {
  const mockMetric = {
    id: "metric-1",
    type: MetricType.FEEDBACK_SCORE,
    value: 0.85,
    count: 100,
    timestamp: new Date("2025-01-09T11:40:24.173Z"),
    sessionId: "session-1",
    modelId: "model-1",
    interval: "1h",
    timeframe: "24h",
    aggregated: true,
    metadata: {
      averageLatency: 150,
      cacheHitRate: 0.8,
      errorRate: 0.05,
      feedbackScore: 4.5,
      queryCount: 500,
      queryPatterns: ["pattern1", "pattern2"],
      successRate: 0.95,
      topQueries: ["query1", "query2"],
      totalSearches: 1000,
      uniqueQueries: 300,
      userSatisfaction: 0.9,
    },
    createdAt: new Date("2025-01-09T11:40:24.173Z"),
    updatedAt: new Date("2025-01-09T11:40:24.173Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should use Node.js runtime", () => {
      expect(runtime).toBe("nodejs");
    });
  });

  describe("GET /api/nous/learn/metrics", () => {
    it("should fetch metrics with default parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics"
      );

      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([mockMetric]);
      vi.mocked(prisma.learningMetric.count).mockResolvedValue(1);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [mockMetric],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });
});
