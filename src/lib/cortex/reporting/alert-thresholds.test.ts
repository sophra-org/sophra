import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertService } from './alert-thresholds';
import type { Logger } from '@/lib/shared/types';
import type { MetricsService } from '@/lib/cortex/monitoring/metrics';
import type { AnalyticsReport } from '@/lib/cortex/analytics/types';

describe('AlertService', () => {
  let alertService: AlertService;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;

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
      recordAlert: vi.fn(),
      recordLatency: vi.fn(),
      incrementError: vi.fn(),
      updateResourceUsage: vi.fn(),
    } as unknown as MetricsService;

    alertService = new AlertService({
      logger: mockLogger,
      metrics: mockMetrics,
    });
  });

  describe('checkThresholds', () => {
    it('should trigger alert when threshold is exceeded', async () => {
      const report: AnalyticsReport = {
        timeWindow: '1h',
        generatedAt: new Date(),
        metrics: {
          totalSearches: 1000,
          averageLatency: 500,
          cacheHitRate: 0.8,
          errorRate: 0.05,
        },
        trends: [],
        insights: [],
        popularQueries: [],
      };

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('averageLatency', [{
        metric: 'averageLatency',
        operator: 'gt',
        value: 400,
        severity: 'warning',
      }]);

      await alertService.checkThresholds(report);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Alert: averageLatency threshold violated',
        expect.objectContaining({
          metric: 'averageLatency',
          value: 500,
          severity: 'warning',
        })
      );

      expect(mockMetrics.recordAlert).toHaveBeenCalledWith(
        'averageLatency',
        expect.objectContaining({
          severity: 'warning',
          threshold: 400,
          value: 500,
          actual: 500,
        })
      );
    });

    it('should handle multiple thresholds for same metric', async () => {
      const report: AnalyticsReport = {
        timeWindow: '1h',
        generatedAt: new Date(),
        metrics: {
          totalSearches: 1000,
          averageLatency: 200,
          cacheHitRate: 0.8,
          errorRate: 0.1,
        },
        trends: [],
        insights: [],
        popularQueries: [],
      };

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('errorRate', [
        {
          metric: 'errorRate',
          operator: 'gt',
          value: 0.05,
          severity: 'warning',
        },
        {
          metric: 'errorRate',
          operator: 'gt',
          value: 0.08,
          severity: 'critical',
        },
      ]);

      await alertService.checkThresholds(report);

      expect(mockMetrics.recordAlert).toHaveBeenCalledTimes(2);
    });

    it('should not trigger alert when threshold is not violated', async () => {
      const report: AnalyticsReport = {
        timeWindow: '1h',
        generatedAt: new Date(),
        metrics: {
          totalSearches: 50,
          averageLatency: 100,
          cacheHitRate: 0.9,
          errorRate: 0.01,
        },
        trends: [],
        insights: [],
        popularQueries: [],
      };

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('totalSearches', [{
        metric: 'totalSearches',
        operator: 'gt',
        value: 100,
        severity: 'warning',
      }]);

      await alertService.checkThresholds(report);

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockMetrics.recordAlert).not.toHaveBeenCalled();
    });

    it('should handle different comparison operators', async () => {
      const report: AnalyticsReport = {
        timeWindow: '1h',
        generatedAt: new Date(),
        metrics: {
          totalSearches: 1000,
          averageLatency: 200,
          cacheHitRate: 0.8,
          errorRate: 0.05,
        },
        trends: [],
        insights: [],
        popularQueries: [],
      };

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('averageLatency', [{
        metric: 'averageLatency',
        operator: 'lt',
        value: 300,
        severity: 'info',
      }]);

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('cacheHitRate', [{
        metric: 'cacheHitRate',
        operator: 'gt',
        value: 0.75,
        severity: 'warning',
      }]);

      // @ts-expect-error: Accessing private property for testing
      alertService.thresholds.set('totalSearches', [{
        metric: 'totalSearches',
        operator: 'eq',
        value: 1000,
        severity: 'info',
      }]);

      await alertService.checkThresholds(report);

      expect(mockMetrics.recordAlert).toHaveBeenCalledTimes(3);
    });
  });
}); 