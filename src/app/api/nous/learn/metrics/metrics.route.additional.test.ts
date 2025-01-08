import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { MetricType } from "@prisma/client";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, runtime } from "./route";

// Mock dependencies
vi.mock("@lib/shared/database/client", () => ({
  prisma: {
    learningMetric: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@lib/shared/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Metrics Route Additional Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Configuration", () => {
    it("should use Node.js runtime", () => {
      expect(runtime).toBe("nodejs");
    });
  });

  describe("GET Endpoint", () => {
    const mockMetric = {
      id: "metric-1",
      type: MetricType.FEEDBACK_SCORE,
      value: 0.85,
      count: 100,
      timestamp: new Date(),
      sessionId: "session-1",
      interval: "1h",
      timeframe: "24h",
      modelId: "model-1",
      aggregated: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        totalSearches: 1000,
        averageLatency: 150,
        successRate: 0.95,
        errorRate: 0.05,
        cacheHitRate: 0.8,
        queryCount: 500,
        uniqueQueries: 300,
        topQueries: ["query1", "query2"],
        queryPatterns: ["pattern1", "pattern2"],
        feedbackScore: 4.5,
        userSatisfaction: 0.9,
      },
    };

    it("should process request with default parameters", async () => {
      const request = new NextRequest("http://localhost/api/learn/metrics");
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([mockMetric]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [
          expect.objectContaining({
            id: mockMetric.id,
            type: mockMetric.type,
            value: mockMetric.value,
          }),
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            interval: "1h",
          }),
        })
      );
    });

    it("should validate metric types", async () => {
      const request = new NextRequest(
        "http://localhost/api/learn/metrics?metrics=INVALID_METRIC"
      );

      const response = await GET(request);
      const data = await response.json();

      //Status code is already correct for validation failure (400)
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid parameters",
        details: expect.any(Object),
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should handle multiple metrics", async () => {
      const request = new NextRequest(
        "http://localhost/api/learn/metrics?metrics=FEEDBACK_SCORE,ENGAGEMENT_RATE"
      );

      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([
        mockMetric,
        { ...mockMetric, id: "metric-2", type: MetricType.ENGAGEMENT_RATE },
      ]);

      const response = await GET(request);
      const data = await response.json();

      expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: { in: ["FEEDBACK_SCORE", "ENGAGEMENT_RATE"] },
          }),
        })
      );
      expect(data.metrics).toHaveLength(2);
    });

    it("should handle different timeframes", async () => {
      const timeframes = ["1h", "24h", "7d", "30d"] as const;

      for (const timeframe of timeframes) {
        const request = new NextRequest(
          `http://localhost/api/learn/metrics?timeframe=${timeframe}`
        );

        vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([
          mockMetric,
        ]);

        await GET(request);

        expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              timestamp: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
          })
        );
      }
    });

    it("should handle different intervals", async () => {
      const intervals = ["1h", "1d"] as const;

      for (const interval of intervals) {
        const request = new NextRequest(
          `http://localhost/api/learn/metrics?interval=${interval}`
        );

        vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([
          mockMetric,
        ]);

        await GET(request);

        expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              interval,
            }),
          })
        );
      }
    });

    it("should format metadata correctly", async () => {
      const request = new NextRequest("http://localhost/api/learn/metrics");
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([mockMetric]);

      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics[0].metadata).toEqual({
        totalSearches: 1000,
        averageLatency: 150,
        successRate: 0.95,
        errorRate: 0.05,
        cacheHitRate: 0.8,
        queryCount: 500,
        uniqueQueries: 300,
        topQueries: ["query1", "query2"],
        queryPatterns: ["pattern1", "pattern2"],
        feedbackScore: 4.5,
        userSatisfaction: 0.9,
      });
    });

    it("should handle missing metadata fields", async () => {
      const metricWithMissingMetadata = {
        ...mockMetric,
        metadata: {},
      };

      const request = new NextRequest("http://localhost/api/learn/metrics");
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([
        metricWithMissingMetadata,
      ]);

      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics[0].metadata).toEqual({
        totalSearches: 0,
        averageLatency: 0,
        successRate: 0,
        errorRate: 0,
        cacheHitRate: 0,
        queryCount: 0,
        uniqueQueries: 0,
        topQueries: [],
        queryPatterns: [],
        feedbackScore: 0,
        userSatisfaction: 0,
      });
    });

    it("should handle database errors", async () => {
      const request = new NextRequest("http://localhost/api/learn/metrics");
      vi.mocked(prisma.learningMetric.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch metrics",
        details: "Database error",
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      });

      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch metrics",
        expect.any(Object)
      );
    });

    it("should handle empty results", async () => {
      const request = new NextRequest("http://localhost/api/learn/metrics");
      vi.mocked(prisma.learningMetric.findMany).mockResolvedValue([]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        metrics: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should validate timeframe parameter", async () => {
      const request = new NextRequest(
        "http://localhost/api/learn/metrics?timeframe=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
    });

    it("should validate interval parameter", async () => {
      const request = new NextRequest(
        "http://localhost/api/learn/metrics?interval=invalid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid parameters");
    });

    it("should calculate correct date ranges", async () => {
      const now = new Date("2024-01-15T12:00:00Z");
      vi.setSystemTime(now);

      type TimeframeTest = {
        timeframe: "1h" | "24h" | "7d" | "30d";
        adjustment: { hours?: number; days?: number };
      };

      const timeframeTests: TimeframeTest[] = [
        { timeframe: "1h", adjustment: { hours: 1 } },
        { timeframe: "24h", adjustment: { days: 1 } },
        { timeframe: "7d", adjustment: { days: 7 } },
        { timeframe: "30d", adjustment: { days: 30 } },
      ];

      for (const { timeframe, adjustment } of timeframeTests) {
        const request = new NextRequest(
          `http://localhost/api/learn/metrics?timeframe=${timeframe}`
        );

        await GET(request);

        const expectedStartDate = new Date(now);
        if (adjustment.hours) {
          expectedStartDate.setHours(now.getHours() - adjustment.hours);
        }
        if (adjustment.days) {
          expectedStartDate.setDate(now.getDate() - adjustment.days);
        }

        expect(prisma.learningMetric.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              timestamp: {
                gte: expectedStartDate,
                lte: now,
              },
            }),
          })
        );
      }

      vi.useRealTimers();
    });
  });
});
