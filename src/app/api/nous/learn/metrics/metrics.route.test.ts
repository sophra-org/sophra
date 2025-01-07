import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { mockPrisma } from "~/vitest.setup";
import { MetricType } from "@prisma/client";
import { MockRequest } from "@/lib/test/next-server.mock";

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
  const mockMetric = {
    id: "test-1",
    timestamp: new Date(),
    sessionId: "sess-1",
    totalSearches: 100,
    averageLatency: 150,
    successRate: 0.95,
    errorRate: 0.05,
    cacheHitRate: 0.8,
    queryCount: 1000,
    uniqueQueries: 800,
    topQueries: ["query1", "query2"],
    queryPatterns: ["pattern1", "pattern2"],
    feedbackScore: 4.5,
    userSatisfaction: 0.9,
    timeWindow: "1h",
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {}
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/metrics", () => {
    it("should fetch metrics with default parameters", async () => {
      const mockMetricWithRequired = {
        ...mockMetric,
        type: "SEARCH",
        value: 100,
        count: 1,
        interval: "1h",
        timeframe: "1h",
        modelId: null,
        aggregated: false
      };

      vi.mocked(mockPrisma.learningMetric.findMany).mockResolvedValueOnce([{
        ...mockMetricWithRequired,
        type: "SEARCH" as MetricType
      }]);
      vi.mocked(mockPrisma.learningMetric.count).mockResolvedValueOnce(1);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/metrics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockMetric]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10
      });
    });

    // ... rest of the tests using mockMetric ...
  });
}); 