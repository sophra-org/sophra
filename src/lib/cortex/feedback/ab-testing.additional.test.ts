import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchABTestingService } from './ab-testing';
import type { Logger } from '@/lib/shared/types';
import type { MetricsService } from '@/lib/cortex/monitoring/metrics';
import { prisma } from '@/lib/shared/database/client';

// Import interfaces from ab-testing.ts
interface SearchVariant {
  id: string;
  name?: string;
  weights?: Record<string, number>;
  allocation?: number;
}

interface ABTestConfig {
  id: string;
  name: string;
  variants: SearchVariant[];
  startDate?: Date;
  endDate?: Date;
  trafficAllocation?: number;
}

describe('SearchABTestingService Additional Tests', () => {
  let service: SearchABTestingService;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    mockMetrics = {
      updateABTestMetrics: vi.fn(),
    } as unknown as MetricsService;

    service = new SearchABTestingService({
      logger: mockLogger,
      prisma,
      metrics: mockMetrics,
    });

    vi.clearAllMocks();
  });

  describe('Test Creation and Retrieval', () => {
    it('should create a new test with valid configuration', async () => {
      const testConfig = {
        name: 'Test Search Ranking',
        description: 'Testing new ranking algorithm',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'ACTIVE',
        configuration: {
          variants: [
            {
              id: 'control',
              name: 'Control',
              weights: { title: 1.0, content: 1.0 },
              allocation: 0.5,
            },
            {
              id: 'variant-a',
              name: 'New Algorithm',
              weights: { title: 1.2, content: 0.8 },
              allocation: 0.5,
            },
          ],
        },
      };

      vi.spyOn(prisma.aBTest, 'create').mockResolvedValue({
        ...testConfig,
        id: 'test-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.createTest(testConfig);
      expect(result.id).toBeDefined();
      expect(result.name).toBe(testConfig.name);
      expect(result.status).toBe('ACTIVE');
    });

    it('should retrieve an active test by name', async () => {
      const mockTest = {
        id: 'test-1',
        name: 'Test Search Ranking',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      };

      vi.spyOn(prisma.aBTest, 'findFirst').mockResolvedValue(mockTest as any);

      const result = await service.getTestByName('Test Search Ranking');
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-1');
    });

    it('should handle non-existent test retrieval', async () => {
      vi.spyOn(prisma.aBTest, 'findFirst').mockResolvedValue(null);

      const result = await service.getTestByName('Non-existent Test');
      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No active test found with name',
        expect.any(Object)
      );
    });
  });

  describe('Metrics Tracking and Analysis', () => {
    it('should track conversion events', async () => {
      const conversionEvent = {
        testId: 'test-1',
        variantId: 'variant-a',
        sessionId: 'session-1',
        event: 'purchase',
        value: 1,
      };

      vi.spyOn(prisma.aBTestMetric, 'create').mockResolvedValue({} as any);

      await service.trackConversion(conversionEvent);
      expect(prisma.aBTestMetric.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: conversionEvent.variantId,
          eventType: conversionEvent.event,
          value: conversionEvent.value,
        }),
      });
    });

    it('should calculate metrics for variants', async () => {
      const mockMetricsData = [
        {
          variantId: 'control',
          _count: 100,
          _sum: { value: 20 },
        },
        {
          variantId: 'variant-a',
          _count: 100,
          _sum: { value: 25 },
        },
      ];

      vi.spyOn(prisma.aBTestMetric, 'groupBy').mockResolvedValue(mockMetricsData as any);

      const metrics = await service.calculateMetrics('test-1');
      expect(metrics.control.conversion_rate).toBe(0.2);
      expect(metrics['variant-a'].conversion_rate).toBe(0.25);
    });

    it('should calculate time series metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-07');
      const mockTimeSeriesData = [
        {
          variantId: 'control',
          timestamp: new Date('2024-01-01'),
          value: 0.2,
        },
        {
          variantId: 'variant-a',
          timestamp: new Date('2024-01-01'),
          value: 0.25,
        },
      ];

      vi.spyOn(prisma.aBTestMetric, 'findMany').mockResolvedValue(mockTimeSeriesData as any);

      const timeSeriesMetrics = await service.getTimeSeriesMetrics(
        'test-1',
        startDate,
        endDate,
        'daily'
      );

      expect(timeSeriesMetrics.dates).toBeDefined();
      expect(timeSeriesMetrics.metrics.control).toBeDefined();
      expect(timeSeriesMetrics.metrics.variant_a).toBeDefined();
    });

    it('should calculate segment metrics', async () => {
      const segments = {
        userType: ['new', 'returning'],
        device: ['mobile', 'desktop'],
      };

      const segmentMetrics = await service.getSegmentMetrics('test-1', segments);
      expect(segmentMetrics.userType).toBeDefined();
      expect(segmentMetrics.device).toBeDefined();
    });
  });

  describe('Variant Selection and Assignment', () => {
    it('should handle variant selection with uneven allocations', async () => {
      const test: ABTestConfig = {
        id: 'test-1',
        name: 'Test',
        variants: [
          { id: 'control', allocation: 0.7 },
          { id: 'variant-a', allocation: 0.3 },
        ],
      };

      // Run multiple selections to verify distribution
      const selections = new Map<string, number>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const variant = (service as any).selectVariant(test);
        selections.set(variant.id, (selections.get(variant.id) || 0) + 1);
      }

      // Check rough distribution (allowing for some randomness)
      const controlRatio = selections.get('control')! / iterations;
      expect(controlRatio).toBeCloseTo(0.7, 1);
    });

    it('should normalize variant allocations', async () => {
      const test: ABTestConfig = {
        id: 'test-1',
        name: 'Test',
        variants: [
          { id: 'control', allocation: 2 },
          { id: 'variant-a', allocation: 1 },
        ],
      };

      const variant = (service as any).selectVariant(test);
      expect(variant).toBeDefined();
      expect(test.variants[0].allocation! + test.variants[1].allocation!).toBe(1);
    });

    it('should handle missing allocations', async () => {
      const test: ABTestConfig = {
        id: 'test-1',
        name: 'Test',
        variants: [
          { id: 'control' },
          { id: 'variant-a' },
        ],
      };

      const variant = (service as any).selectVariant(test);
      expect(variant).toBeDefined();
      expect(test.variants[0].allocation).toBe(0.5);
      expect(test.variants[1].allocation).toBe(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in test creation', async () => {
      const testConfig = {
        name: 'Test Search Ranking',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
        configuration: {
          variants: [],
        },
      };

      vi.spyOn(prisma.aBTest, 'create').mockRejectedValue(new Error('Database error'));

      await expect(service.createTest(testConfig)).rejects.toThrow('Database error');
    });

    it('should handle invalid test configurations', async () => {
      const invalidTest: ABTestConfig = {
        id: 'test-1',
        name: 'Test',
        variants: [], // Empty variants array
      };

      expect(() => (service as any).selectVariant(invalidTest)).toThrow('Test has no variants');
    });

    it('should handle errors in metrics calculation', async () => {
      vi.spyOn(prisma.aBTestMetric, 'groupBy').mockRejectedValue(new Error('Metrics error'));

      await expect(service.calculateMetrics('test-1')).rejects.toThrow('Metrics error');
    });
  });
});
