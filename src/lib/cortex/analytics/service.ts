import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { prisma } from "@/lib/shared/database/client";
import { SearchAnalyticsWhereInputSchema } from "@/lib/shared/database/validation/generated";
import { Logger } from "@/lib/shared/types";
import { InputJsonValue, JsonValue } from "@prisma/client/runtime/library";
import { z } from "zod";
import type {
  AnalyticsReport,
  AnalyticsTrend,
  PerformanceInsight,
} from "./types";

const TimeWindowSchema = z.enum(["1h", "24h", "7d", "30d"]);

export class AnalyticsService {
  private readonly logger: Logger;
  private readonly metrics: MetricsService;
  private readonly prisma: typeof prisma;

  constructor(config: { logger: Logger; metrics?: MetricsService; environment?: string }) {
    this.logger = config.logger;
    this.metrics = config.metrics ?? new MetricsService({
      logger: this.logger,
      environment: config.environment ?? 'development'
    });
    this.prisma = prisma;
  }

  private getTimeWindowStart(timeWindow: string): Date {
    const now = new Date();
    const hours =
      {
        "1h": 1,
        "24h": 24,
        "7d": 24 * 7,
        "30d": 24 * 30,
      }[timeWindow] || 24;

    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  async createSearchEvent(data: {
    query: string;
    timestamp: Date;
    searchType: string;
    totalHits: number;
    took: number;
    facetsUsed?: JsonValue;
    sessionId?: string | null;
    resultIds?: JsonValue;
    filters?: JsonValue;
  }): Promise<void> {
    try {
      await this.prisma.searchAnalytics.create({
        data: {
          query: data.query,
          timestamp: data.timestamp,
          searchType: data.searchType,
          totalHits: data.totalHits,
          took: data.took,
          facetsUsed: data.facetsUsed as InputJsonValue,
          sessionId: data.sessionId,
          resultIds: data.resultIds as InputJsonValue,
          filters: data.filters as InputJsonValue,
          page: 1,
          pageSize: 10,
        },
      });
      this.logger.debug('Search event created successfully', { data });
    } catch (error) {
      this.logger.error('Failed to create search event', { error, data });
      throw error;
    }
  }

  async getSearchEvents(params: {
    sessionId?: string;
    timeframe?: string;
    limit?: number;
  }): Promise<
    Array<{
      id: string;
      query: string;
      timestamp: Date;
      searchType: string;
      totalHits: number;
      took: number;
      facetsUsed?: JsonValue;
      sessionId?: string | null;
      resultIds?: JsonValue;
      filters?: JsonValue;
      page?: number;
      pageSize?: number;
    }>
  > {
    const where = SearchAnalyticsWhereInputSchema.parse({
      sessionId: params.sessionId,
      ...(params.timeframe && {
        timestamp: {
          gte: this.getTimeWindowStart(params.timeframe),
        },
      }),
    });

    return this.prisma.searchAnalytics.findMany({
      where,
      take: params.limit,
      orderBy: {
        timestamp: "desc",
      },
      select: {
        id: true,
        query: true,
        timestamp: true,
        searchType: true,
        totalHits: true,
        took: true,
        facetsUsed: true,
        sessionId: true,
        resultIds: true,
        filters: true,
        page: true,
        pageSize: true,
      },
    });
  }

  async generateReport(timeWindow: string): Promise<AnalyticsReport> {
    try {
      const validationResult = TimeWindowSchema.safeParse(timeWindow);

      if (!validationResult.success) {
        throw new Error(
          `Invalid time window: ${timeWindow}. Must be one of: 1h, 24h, 7d, 30d`
        );
      }

      const startTime = this.getTimeWindowStart(validationResult.data);
      const metrics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });

      const totalSearches = metrics.length;
      const averageLatency =
        metrics.reduce((acc, curr) => acc + curr.took, 0) / totalSearches || 0;
      const cacheHits = metrics.filter(
        (m) => Array.isArray(m.resultIds) && (m.resultIds as any[]).length > 0
      ).length;
      const cacheHitRate = (cacheHits / totalSearches) * 100 || 0;
      const errors = metrics.filter((m) => m.totalHits === 0).length;
      const errorRate = (errors / totalSearches) * 100 || 0;

      // Calculate popular queries with required metrics
      const popularQueries = this.calculatePopularQueries(metrics);

      // Calculate trends
      const previousPeriodStart = new Date(startTime.getTime() - (startTime.getTime() - new Date().getTime()));
      const previousMetrics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: previousPeriodStart,
            lt: startTime,
          },
        },
      });

      const trends: AnalyticsTrend[] = [
        {
          metric: 'totalSearches',
          current: totalSearches,
          trend: totalSearches > previousMetrics.length ? 'increasing' : totalSearches < previousMetrics.length ? 'decreasing' : 'stable',
          change: ((totalSearches - previousMetrics.length) / previousMetrics.length) * 100,
        },
        {
          metric: 'averageLatency',
          current: averageLatency,
          trend: averageLatency > (previousMetrics.reduce((acc, curr) => acc + curr.took, 0) / previousMetrics.length || 0) ? 'increasing' : averageLatency < (previousMetrics.reduce((acc, curr) => acc + curr.took, 0) / previousMetrics.length || 0) ? 'decreasing' : 'stable',
          change: ((averageLatency - (previousMetrics.reduce((acc, curr) => acc + curr.took, 0) / previousMetrics.length || 0)) / (previousMetrics.reduce((acc, curr) => acc + curr.took, 0) / previousMetrics.length || 1)) * 100,
        },
        {
          metric: 'errorRate',
          current: errorRate,
          trend: errorRate > (previousMetrics.filter(m => m.totalHits === 0).length / previousMetrics.length * 100 || 0) ? 'increasing' : errorRate < (previousMetrics.filter(m => m.totalHits === 0).length / previousMetrics.length * 100 || 0) ? 'decreasing' : 'stable',
          change: ((errorRate - (previousMetrics.filter(m => m.totalHits === 0).length / previousMetrics.length * 100 || 0)) / (previousMetrics.filter(m => m.totalHits === 0).length / previousMetrics.length * 100 || 1)) * 100,
        },
      ];

      // Generate insights
      const insights: PerformanceInsight[] = [
        {
          type: 'search',
          message: `Average latency is ${averageLatency.toFixed(2)}ms`,
          severity: averageLatency > 1000 ? 'high' : averageLatency > 500 ? 'medium' : 'low',
          metric: 'latency',
          currentValue: averageLatency,
          recommendedValue: 500,
          action: 'Optimize search performance if latency continues to increase'
        },
        {
          type: 'error',
          message: `Error rate is ${errorRate.toFixed(2)}%`,
          severity: errorRate > 5 ? 'high' : errorRate > 1 ? 'medium' : 'low',
          metric: 'error_rate',
          currentValue: errorRate,
          recommendedValue: 1,
          action: 'Investigate and fix search errors if rate exceeds threshold'
        },
      ];

      return {
        timeWindow,
        generatedAt: new Date(),
        metrics: {
          totalSearches,
          averageLatency,
          cacheHitRate,
          errorRate,
        },
        trends,
        insights,
        popularQueries,
      };
    } catch (error) {
      this.logger.error("Failed to generate analytics report", {
        error,
        timeWindow,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private calculatePopularQueries(metrics: any[]): Array<{
    query: string;
    count: number;
    avgLatency: number;
    cacheHitRate: number;
  }> {
    const queryStats = metrics.reduce(
      (acc, curr) => {
        const query = curr.query || "";
        if (!acc[query]) {
          acc[query] = {
            count: 0,
            totalLatency: 0,
            cacheHits: 0,
          };
        }
        acc[query].count++;
        acc[query].totalLatency += curr.took || 0;
        acc[query].cacheHits +=
          Array.isArray(curr.resultIds) && curr.resultIds.length > 0 ? 1 : 0;
        return acc;
      },
      {} as Record<
        string,
        { count: number; totalLatency: number; cacheHits: number }
      >
    );
    return Object.entries(queryStats)
      .sort(
        ([, a], [, b]) =>
          (b as { count: number }).count - (a as { count: number }).count
      )
      .slice(0, 10)
      .map((entry) => {
        const [query, stats] = entry as [
          string,
          { count: number; totalLatency: number; cacheHits: number },
        ];
        return {
          query,
          count: stats.count,
          avgLatency: stats.totalLatency / stats.count,
          cacheHitRate: (stats.cacheHits / stats.count) * 100,
        };
      });
  }
}
