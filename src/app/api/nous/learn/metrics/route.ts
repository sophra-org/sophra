import { prisma } from "@lib/shared/database/client";
import logger from "@lib/shared/logger";
import { LearningEventPriority, LearningEventStatus, LearningEventType, MetricType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Declare Node.js runtime
export const runtime = "nodejs";

const VALID_TIMEFRAMES = ["1h", "24h", "7d", "30d"] as const;
const VALID_INTERVALS = ["1h", "1d"] as const;

const MetricsRequestSchema = z.object({
  metrics: z.string().optional(),
  timeframe: z.enum(VALID_TIMEFRAMES).optional(),
  interval: z.enum(VALID_INTERVALS).optional(),
  include_metadata: z.string().optional(),
}).transform(data => ({
  metrics: data.metrics?.split(",").map(m => m.toUpperCase()) as MetricType[] || Object.values(MetricType),
  timeframe: data.timeframe || "24h",
  interval: data.interval || "1h",
  include_metadata: data.include_metadata === "true"
}));

export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const validation = MetricsRequestSchema.safeParse(Object.fromEntries(searchParams));

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          details: validation.error.format(),
          pagination: {
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
          }
        },
        { status: 400 }
      );
    }

    const { metrics, timeframe, interval } = validation.data;

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date(now);
    switch (timeframe) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
    }

    logger.debug("Fetching metrics", {
      metrics,
      timeframe,
      interval,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

    // Log query parameters
    logger.debug("Querying metrics with params", {
      types: metrics,
      interval,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

    // First check if any metrics exist at all
    const totalMetrics = await prisma.learningMetric.count();
    logger.debug("Total metrics in database", { count: totalMetrics });

    // Get raw metrics with relaxed conditions first
    const results = await prisma.learningMetric.findMany({
      where: {
        type: { in: metrics }
      },
      orderBy: { timestamp: "asc" },
    });

    logger.debug("Found metrics with relaxed conditions", {
      count: results.length,
      types: [...new Set(results.map(r => r.type))],
      intervals: [...new Set(results.map(r => r.interval))],
      timeRange: results.length > 0 ? {
        earliest: results[0].timestamp,
        latest: results[results.length - 1].timestamp
      } : null
    });

    // Filter metrics by time range and interval
    const filteredResults = results.filter(metric => {
      const timestamp = new Date(metric.timestamp);
      const matchesTimeRange = timestamp >= startDate && timestamp <= now;
      const matchesInterval = !interval || metric.interval === interval;
      return matchesTimeRange && matchesInterval;
    });

    logger.debug("Found raw metrics", {
      count: results.length,
      types: [...new Set(results.map(r => r.type))],
      timeRange: {
        earliest: results[0]?.timestamp,
        latest: results[results.length - 1]?.timestamp
      }
    });

    // Log requested metrics
    logger.debug("Requested metrics", {
      requested: metrics,
      available: Object.values(MetricType)
    });

    // Validate metric types
    const validTypes = metrics.filter(type => 
      Object.values(MetricType).includes(type as MetricType)
    );

    if (validTypes.length === 0) {
      logger.warn("No valid metric types provided", {
        requested: metrics,
        available: Object.values(MetricType),
        validationResult: metrics.map(type => ({
          type,
          isValid: Object.values(MetricType).includes(type as MetricType)
        }))
      });
      return NextResponse.json({
        metrics: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0
        },
        meta: {
          timeframe,
          interval,
          aggregated: true,
          generated_at: new Date().toISOString(),
          metrics_count: {
            total: 0,
            aggregated: 0,
            by_type: {}
          }
        }
      });
    }

    // Group filtered metrics by type and interval for aggregation
    const groupedMetrics = filteredResults.reduce((acc, metric) => {
      const key = `${metric.type}_${metric.interval}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, typeof results>);

    logger.debug("Grouped metrics", {
      groups: Object.keys(groupedMetrics),
      countsByGroup: Object.fromEntries(
        Object.entries(groupedMetrics).map(([key, metrics]) => [key, metrics.length])
      )
    });

    logger.debug("Creating learning event for metric aggregation", {
      timeframe,
      interval,
      metricTypes: metrics,
      totalMetrics: totalMetrics,
      groups: Object.keys(groupedMetrics)
    });

    // Create learning event for metric aggregation
    const learningEvent = await prisma.learningEvent.create({
      data: {
        type: LearningEventType.METRIC_THRESHOLD,
        status: LearningEventStatus.COMPLETED,
        priority: LearningEventPriority.LOW,
        timestamp: new Date(),
        metadata: {
          timeframe,
          interval,
          metricTypes: metrics,
          totalMetrics: totalMetrics,
          aggregationStats: {
            groups: Object.keys(groupedMetrics),
            countsByGroup: Object.fromEntries(
              Object.entries(groupedMetrics).map(([key, metrics]) => [key, metrics.length])
            )
          }
        },
        retryCount: 0,
        tags: ['metrics', 'aggregation']
      }
    });

    logger.debug("Created learning event for metric aggregation", {
      eventId: learningEvent.id,
      timestamp: new Date().toISOString()
    });

    // Aggregate metrics
    const aggregatedResults = Object.entries(groupedMetrics).map(([key, metrics]) => {
      const [type] = key.split('_');
      const totalCount = metrics.reduce((sum, m) => sum + m.count, 0);
      const weightedValue = metrics.reduce((sum, m) => sum + (m.value * m.count), 0) / totalCount;

      // Combine metadata
      const combinedMetadata = metrics.reduce((acc, m) => {
        const meta = m.metadata as Record<string, any>;
        Object.entries(meta).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            acc[key] = [...(acc[key] || []), ...value];
          } else if (typeof value === 'number') {
            acc[key] = (acc[key] || 0) + value;
          }
        });
        return acc;
      }, {} as Record<string, any>);

      return {
        type,
        value: weightedValue,
        count: totalCount,
        metadata: combinedMetadata,
        interval,
        timeframe,
        aggregated: true
      };
    });

    // Format aggregated results
    const formattedResults = aggregatedResults.map(metric => {
      // Calculate time range for this metric
      const metricStartDate = new Date(startDate);
      const metricEndDate = new Date(now);

      return {
        type: metric.type,
        value: metric.value,
        count: metric.count,
        interval: metric.interval,
        timeframe: metric.timeframe,
        aggregated: metric.aggregated,
        time_range: {
          start: metricStartDate.toISOString(),
          end: metricEndDate.toISOString()
        },
        metadata: metric.metadata
      };
    });

    logger.info("Returning metrics response", {
      totalMetrics: results.length,
      aggregatedMetrics: formattedResults.length,
      timeframe,
      interval,
      metricTypes: [...new Set(formattedResults.map(r => r.type))]
    });

    return NextResponse.json({
      metrics: formattedResults,
      pagination: {
        page: 1,
        pageSize: 10,
        total: formattedResults.length,
        totalPages: Math.ceil(formattedResults.length / 10),
      },
      meta: {
        timeframe,
        interval,
        aggregated: true,
        generated_at: new Date().toISOString(),
      metrics_count: {
        total: filteredResults.length,
        aggregated: formattedResults.length,
        by_type: validTypes.reduce((acc, type) => {
          acc[type] = filteredResults.filter(r => r.type === type).length;
          return acc;
        }, {} as Record<string, number>)
      }
      }
    });
  } catch (error) {
    logger.error("Failed to fetch metrics", { error });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : "Unknown error",
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        }
      },
      { status: 500 }
    );
  }
}
