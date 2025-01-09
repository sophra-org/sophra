import { MetricType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// Define mock objects
const mockPrisma = {
  learningMetric: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};

const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock modules
vi.mock("next/server", () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    searchParams: new URL(url).searchParams,
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => {
      const response = {
        status: init?.status || 200,
        ok: init?.status ? init.status >= 200 && init.status < 300 : true,
        headers: new Headers(),
      };
      return {
        ...response,
        json: async () => data,
      };
    }),
  },
}));

vi.mock("@lib/shared/database/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@lib/shared/logger", () => ({
  default: mockLogger,
}));

// Import after mocks
import { prisma } from "@lib/shared/database/client";

describe("Learning Metrics Route Handler", () => {
  const mockMetric = {
    id: "test-1",
    type: MetricType.FEEDBACK_SCORE,
    value: 100,
    count: 1,
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
    metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/metrics", () => {
    it("should fetch metrics with default parameters", async () => {
      const mockMetricWithRequired = {
        ...mockMetric,
        interval: "1h",
        modelId: null,
        timeframe: "1h",
        aggregated: false,
      };

      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([
        mockMetricWithRequired,
      ]);
      vi.mocked(prisma.learningMetric.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockMetric]);
      expect(data.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    // ... rest of the tests using mockMetric ...
  });
});
