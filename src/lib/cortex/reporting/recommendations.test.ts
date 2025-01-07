import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationService } from './recommendations';
import type { Logger } from '@/lib/shared/types';
import type { MetricsService } from '@/lib/cortex/monitoring/metrics';
import type { AnalyticsReport } from '@/lib/cortex/analytics/types';

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;
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
      recordRecommendation: vi.fn(),
      recordLatency: vi.fn(),
      incrementError: vi.fn(),
    } as unknown as MetricsService;

    recommendationService = new RecommendationService();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on latency trend', async () => {
      const report: AnalyticsReport = {
        metrics: {
          totalSearches: 1000,
          averageLatency: 100,
          errorRate: 0.01,
          cacheHitRate: 0.8,
        },
        trends: [
          { 
            metric: 'latency', 
            change: 0.2,
            current: 100,
            trend: 'increasing'
          }
        ],
        generatedAt: new Date(),
        timeWindow: '24h',
        insights: [],
        popularQueries: [],
      };

      const recommendations = await recommendationService.generateRecommendations(report);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toEqual(
        expect.objectContaining({
          type: 'performance',
          priority: 'critical',
          message: expect.stringContaining('latency'),
          metrics: expect.objectContaining({
            change: 0.2
          }),
        })
      );
    });

    it('should generate cache recommendations', async () => {
      const report: AnalyticsReport = {
        metrics: {
          totalSearches: 1000,
          averageLatency: 100,
          errorRate: 0.01,
          cacheHitRate: 0.6,
        },
        trends: [],
        generatedAt: new Date(),
        timeWindow: '24h',
        insights: [],
        popularQueries: [],
      };

      const recommendations = await recommendationService.generateRecommendations(report);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]).toEqual(
        expect.objectContaining({
          type: 'cache',
          priority: 'high',
          message: expect.stringContaining('cache'),
          metrics: expect.objectContaining({
            current: 0.6,
            target: 0.8
          }),
        })
      );
    });

    it('should handle empty metrics', async () => {
      const report: AnalyticsReport = {
        metrics: {
          totalSearches: 1000,
          averageLatency: 100,
          cacheHitRate: 0.8,
          errorRate: 0.01,
        },
        trends: [],
        generatedAt: new Date(),
        timeWindow: '24h',
        insights: [],
        popularQueries: [],
      };

      const recommendations = await recommendationService.generateRecommendations(report);
      expect(recommendations).toHaveLength(0);
    });

    it('should handle no recommendations needed', async () => {
      const report: AnalyticsReport = {
        metrics: {
          totalSearches: 1000,
          averageLatency: 100,
          cacheHitRate: 0.9,
          errorRate: 0.01,
        },
        trends: [],
        generatedAt: new Date(),
        timeWindow: '24h',
        insights: [],
        popularQueries: [],
      };

      const recommendations = await recommendationService.generateRecommendations(report);
      expect(recommendations).toHaveLength(0);
    });
  });
}); 