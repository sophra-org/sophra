import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import logger from '@lib/shared/logger';
import { MetricType } from "@prisma/client";
import { PrismaClient } from '@prisma/client';

// Mock modules
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    searchParams: new URL(url).searchParams,
    json: vi.fn()
  })),
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      ok: init?.status ? init.status >= 200 && init.status < 300 : true,
      headers: new Headers(),
      json: async () => data
    }))
  }
}));

vi.mock('@lib/shared/database/client', () => {
  const mockPrisma = {
    learningMetric: {
      findMany: vi.fn(),
      count: vi.fn(),
      $queryRaw: vi.fn(),
      groupBy: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      aggregate: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  } as unknown as PrismaClient;

  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { GET } from './route';

describe("Learning Metrics Route Handler", () => {
  const mockMetric = {
    id: "test-1",
    type: MetricType.FEEDBACK_SCORE,
    value: 100,
    count: 1,
    timestamp: new Date(),
    sessionId: "sess-1",
    interval: "1h",
    timeframe: "1h",
    modelId: null,
    aggregated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
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
      userSatisfaction: 0.9
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/nous/learn/metrics", () => {
    it("should fetch metrics with default parameters", async () => {
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([mockMetric]);
      vi.mocked(prisma.learningMetric.count).mockResolvedValue(1);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/metrics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [mockMetric],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      });
    });

    it("should handle filtering by type and timeframe", async () => {
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([mockMetric]);
      vi.mocked(prisma.learningMetric.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?type=FEEDBACK_SCORE&timeframe=24h"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [mockMetric],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      });
      expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: MetricType.FEEDBACK_SCORE,
            timestamp: expect.any(Object)
          })
        })
      );
    });

    it("should handle invalid type parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?type=INVALID"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
      expect(data.details).toBeDefined();
    });

    it("should handle invalid timeframe parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/nous/learn/metrics?timeframe=invalid"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
      expect(data.details).toBeDefined();
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.learningMetric.findMany).mockRejectedValue(new Error("DB Error"));

      const request = new NextRequest("http://localhost:3000/api/nous/learn/metrics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch metrics");
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([]);
      vi.mocked(prisma.learningMetric.count).mockResolvedValue(0);

      const request = new NextRequest("http://localhost:3000/api/nous/learn/metrics");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0
        }
      });
    });
  });
});
