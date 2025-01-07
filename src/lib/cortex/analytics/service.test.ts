import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './service';
import type { Logger } from '@/lib/shared/types';
import { MetricsService } from '@/lib/cortex/monitoring/metrics';
import { prisma } from '@/lib/shared/database/client';
import type { AnalyticsReport, AnalyticsTrend, PerformanceInsight } from './types';
import { JsonValue } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    searchAnalytics: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cortex/monitoring/metrics', () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    recordEngineMetric: vi.fn(),
    recordLatency: vi.fn(),
    incrementError: vi.fn(),
    updateResourceUsage: vi.fn(),
    updateCacheHitRatio: vi.fn(),
    updateSearchQuality: vi.fn(),
    recordAlert: vi.fn(),
    recordReportDistribution: vi.fn(),
    recordSearchMetric: vi.fn(),
    getSearchMetrics: vi.fn(),
  })),
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'analytics',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    // Setup mock metrics service
    mockMetrics = new MetricsService({
      logger: mockLogger,
      environment: 'test'
    });

    // Initialize service
    analyticsService = new AnalyticsService({
      logger: mockLogger,
      metrics: mockMetrics,
      environment: 'test'
    });

    // Setup default mock responses
    vi.mocked(prisma.searchAnalytics.findMany).mockResolvedValue([{
      id: 'test1',
      query: 'test',
      timestamp: new Date(),
      searchType: 'keyword',
      totalHits: 10,
      took: 50,
      facetsUsed: null,
      sessionId: null,
      resultIds: null,
      filters: null,
      page: 1,
      pageSize: 10,
    }]);
  });

  describe('createSearchEvent', () => {
    it('should successfully create a search event', async () => {
      const mockEvent = {
        query: 'test query',
        timestamp: new Date(),
        searchType: 'keyword',
        totalHits: 10,
        took: 50,
        sessionId: 'session123',
        facetsUsed: null,
        resultIds: null,
        page: 1,
        pageSize: 10,
        filters: null,
      };

      vi.spyOn(prisma.searchAnalytics, 'create').mockResolvedValueOnce({
        id: 'event123',
        ...mockEvent,
      } as any);

      await analyticsService.createSearchEvent(mockEvent);

      expect(prisma.searchAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining(mockEvent),
      });
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should handle optional fields', async () => {
      const mockEvent = {
        query: 'test query',
        timestamp: new Date(),
        searchType: 'keyword',
        totalHits: 10,
        took: 50,
        facetsUsed: { category: ['books'] },
        filters: { price: { min: 10 } },
        resultIds: ['id1', 'id2'],
        sessionId: null,
        page: 1,
        pageSize: 10,
      };

      vi.spyOn(prisma.searchAnalytics, 'create').mockResolvedValueOnce({
        id: 'event123',
        ...mockEvent,
      } as any);

      await analyticsService.createSearchEvent(mockEvent);

      expect(prisma.searchAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          facetsUsed: expect.any(Object),
          filters: expect.any(Object),
          resultIds: expect.any(Array),
        }),
      });
    });

    it('should handle database errors', async () => {
      const mockEvent = {
        query: 'test query',
        timestamp: new Date(),
        searchType: 'keyword',
        totalHits: 10,
        took: 50,
        sessionId: null,
        facetsUsed: null,
        resultIds: null,
        page: 1,
        pageSize: 10,
        filters: null,
      };

      const mockError = new Error('Database error');
      vi.spyOn(prisma.searchAnalytics, 'create').mockRejectedValueOnce(mockError);

      await expect(analyticsService.createSearchEvent(mockEvent)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getSearchEvents', () => {
    it('should retrieve search events with default parameters', async () => {
      const mockEvents = [
        {
          id: 'event1',
          query: 'test',
          timestamp: new Date(),
          searchType: 'keyword',
          totalHits: 10,
          took: 50,
          sessionId: null,
          facetsUsed: null,
          resultIds: null,
          page: 1,
          pageSize: 10,
          filters: null,
        },
      ];

      vi.spyOn(prisma.searchAnalytics, 'findMany').mockResolvedValueOnce(mockEvents);

      const result = await analyticsService.getSearchEvents({});

      expect(result).toEqual(mockEvents);
      expect(prisma.searchAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { timestamp: 'desc' },
        })
      );
    });

    it('should apply filters correctly', async () => {
      const sessionId = 'session123';
      const timeframe = '24h';

      vi.spyOn(prisma.searchAnalytics, 'findMany').mockResolvedValueOnce([]);

      await analyticsService.getSearchEvents({ sessionId, timeframe });

      expect(prisma.searchAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionId,
            timestamp: expect.any(Object),
          }),
        })
      );
    });

    it('should handle pagination', async () => {
      const limit = 10;

      vi.spyOn(prisma.searchAnalytics, 'findMany').mockResolvedValueOnce([]);

      await analyticsService.getSearchEvents({ limit });

      expect(prisma.searchAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: limit,
        })
      );
    });
  });

  describe('generateReport', () => {
    it('should generate a complete analytics report', async () => {
      const timeWindow = '24h';
      const mockEvents = [
        {
          id: 'event1',
          query: 'test',
          timestamp: new Date(),
          searchType: 'keyword',
          totalHits: 10,
          took: 50,
          sessionId: null,
          facetsUsed: null,
          resultIds: null,
          page: 1,
          pageSize: 10,
          filters: null,
        },
      ];

      vi.spyOn(prisma.searchAnalytics, 'findMany')
        .mockResolvedValueOnce(mockEvents) // First call for current period
        .mockResolvedValueOnce(mockEvents); // Second call for previous period

      const report = await analyticsService.generateReport(timeWindow);

      expect(report).toEqual(
        expect.objectContaining({
          timeWindow,
          metrics: expect.objectContaining({
            totalSearches: expect.any(Number),
            averageLatency: expect.any(Number),
            cacheHitRate: expect.any(Number),
            errorRate: expect.any(Number),
          }),
          trends: expect.arrayContaining([
            expect.objectContaining({
              metric: expect.any(String),
              current: expect.any(Number),
              trend: expect.any(String),
              change: expect.any(Number),
            }),
          ]),
          insights: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              message: expect.any(String),
              severity: expect.any(String),
            }),
          ]),
          popularQueries: expect.any(Array),
        })
      );
    });

    it('should handle invalid time window', async () => {
      await expect(analyticsService.generateReport('invalid')).rejects.toThrow();
    });

    it('should calculate trends correctly', async () => {
      const timeWindow = '24h';
      const mockEvents = [
        {
          id: 'event1',
          query: 'test',
          timestamp: new Date(),
          searchType: 'keyword',
          totalHits: 10,
          took: 50,
          sessionId: null,
          facetsUsed: null,
          resultIds: null,
          page: 1,
          pageSize: 10,
          filters: null,
        },
      ];

      vi.spyOn(prisma.searchAnalytics, 'findMany')
        .mockResolvedValueOnce(mockEvents) // First call for current period
        .mockResolvedValueOnce(mockEvents); // Second call for previous period

      const report = await analyticsService.generateReport(timeWindow);

      expect(report.trends).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            metric: expect.any(String),
            current: expect.any(Number),
            trend: expect.any(String),
            change: expect.any(Number),
          }),
        ])
      );
    });
  });

  describe('time window calculations', () => {
    it('should calculate correct time window start', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const windows = ['1h', '24h', '7d', '30d'];
      const expectedHours = [1, 24, 24 * 7, 24 * 30];

      windows.forEach((window, index) => {
        const result = analyticsService['getTimeWindowStart'](window);
        const expectedTime = new Date(now.getTime() - expectedHours[index] * 60 * 60 * 1000);
        expect(result.getTime()).toBe(expectedTime.getTime());
      });

      vi.useRealTimers();
    });

    it('should default to 24h for invalid time window', () => {
      const result = analyticsService['getTimeWindowStart']('invalid');
      const expected = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });
  });

  describe('metrics integration', () => {
    it('should use provided metrics service', () => {
      const customMetrics = new MetricsService({ logger: mockLogger, environment: 'test' });
      const service = new AnalyticsService({
        logger: mockLogger,
        metrics: customMetrics,
        environment: 'test'
      });

      expect(service['metrics']).toBe(customMetrics);
    });

    it('should create default metrics service if not provided', () => {
      const service = new AnalyticsService({
        logger: mockLogger,
        environment: 'test'
      });

      expect(service['metrics']).toBeDefined();
      expect(service['metrics']).toHaveProperty('recordEngineMetric');
      expect(service['metrics']).toHaveProperty('recordLatency');
    });
  });
});