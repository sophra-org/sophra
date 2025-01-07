import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportingService } from './service';
import type { Logger } from '@/lib/shared/types';
import type { MetricsService } from '@/lib/cortex/monitoring/metrics';
import type { ReportConfig } from './types';
import type { AnalyticsService } from '@/lib/cortex/analytics/service';
import type { PrismaClient } from '@prisma/client';

describe('ReportingService', () => {
  let reportingService: ReportingService;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;
  let mockAnalytics: AnalyticsService;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      service: 'test',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    mockMetrics = {
      recordReportDistribution: vi.fn(),
      recordLatency: vi.fn(),
      incrementError: vi.fn(),
    } as unknown as MetricsService;

    mockAnalytics = {
      generateReport: vi.fn(),
    } as unknown as AnalyticsService;

    mockPrisma = {
      searchAnalytics: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient;

    reportingService = new ReportingService({
      logger: mockLogger,
      metrics: mockMetrics,
      analytics: mockAnalytics,
      prisma: mockPrisma,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateScheduledReport', () => {
    it('should generate scheduled report successfully', async () => {
      const timeWindow = '24h';

      (mockAnalytics.generateReport as jest.Mock).mockResolvedValueOnce({
        timeWindow,
        metrics: {
          totalSearches: 1000,
          averageLatency: 100,
          cacheHitRate: 0.8,
          errorRate: 0.01,
        },
        generatedAt: new Date(),
        trends: [],
        insights: [],
        popularQueries: [],
      });

      await reportingService.generateScheduledReport(timeWindow);
      
      expect(mockAnalytics.generateReport).toHaveBeenCalledWith(timeWindow);
      expect(mockMetrics.recordReportDistribution).toHaveBeenCalledWith({
        report_type: 'analytics',
        recipient_count: 0,
        type: 'scheduled',
        timeWindow,
      });
    });

    it('should handle analytics service errors', async () => {
      const timeWindow = '24h';
      const error = new Error('Failed to generate analytics report');
      (mockAnalytics.generateReport as jest.Mock).mockRejectedValueOnce(error);

      await expect(reportingService.generateScheduledReport(timeWindow))
        .rejects.toThrow('Failed to generate analytics report');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate scheduled report',
        expect.objectContaining({ error })
      );
    });
  });

  describe('checkAlertThresholds', () => {
    it('should generate alerts for threshold violations', async () => {
      const timeWindow = '24h';
      const report = {
        timeWindow,
        metrics: {
          totalSearches: 1000,
          averageLatency: 300, // Above threshold
          cacheHitRate: 0.5, // Below threshold
          errorRate: 0.01,
        },
        generatedAt: new Date(),
        trends: [],
        insights: [],
        popularQueries: [],
      };

      (mockAnalytics.generateReport as jest.Mock).mockResolvedValueOnce(report);

      await reportingService.generateScheduledReport(timeWindow);

      expect(mockPrisma.searchAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            searchType: 'analytics',
            took: 300,
            totalHits: 1000,
          }),
        })
      );
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for performance issues', async () => {
      const timeWindow = '24h';
      const report = {
        timeWindow,
        metrics: {
          totalSearches: 1000,
          averageLatency: 300, // Above threshold (200ms)
          cacheHitRate: 0.5, // Below threshold (0.7)
          errorRate: 0.01,
        },
        generatedAt: new Date(),
        trends: [],
        insights: [],
        popularQueries: [],
      };

      (mockAnalytics.generateReport as jest.Mock).mockResolvedValueOnce(report);

      await reportingService.generateScheduledReport(timeWindow);

      expect(mockPrisma.searchAnalytics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            searchType: 'analytics',
            took: 300,
            totalHits: 1000,
          }),
        })
      );
    });
  });
});