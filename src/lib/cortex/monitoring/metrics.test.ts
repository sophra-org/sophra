import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService } from './metrics';
import type { Logger } from '@/lib/shared/types';
import { MetricType } from '@prisma/client';

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockLogger: Logger;

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

    metricsService = new MetricsService({
      logger: mockLogger,
      environment: 'test'
    });
  });

  describe('recordEngineMetric', () => {
    it('should record engine metrics correctly', async () => {
      const metric = {
        type: 'LATENCY' as MetricType,
        value: 100,
        confidence: 0.95,
        operationId: 'test-op'
      };

      await metricsService.recordEngineMetric(metric);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Recording engine metric',
        metric
      );
    });

    it('should handle errors gracefully', async () => {
      const invalidMetric = {
        type: 'LATENCY' as MetricType,
        value: undefined as any,
        confidence: 0.95,
        operationId: 'test-op'
      };

      await metricsService.recordEngineMetric(invalidMetric);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record engine metric',
        expect.objectContaining({
          error: expect.any(Error),
          metric: invalidMetric
        })
      );
    });
  });

  describe('recordLatency', () => {
    it('should record operation latency', () => {
      metricsService.recordLatency('test-op', 'test-service', 100);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Recording latency',
        expect.objectContaining({
          operation: 'test-op',
          service: 'test-service',
          latency: 100
        })
      );
    });
  });

  describe('incrementError', () => {
    it('should increment error counter', () => {
      metricsService.incrementError('test-error', 'test-service', 'test-op');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Incrementing error counter',
        expect.objectContaining({
          error: 'test-error',
          service: 'test-service',
          operation: 'test-op'
        })
      );
    });
  });

  describe('updateResourceUsage', () => {
    it('should update resource metrics', () => {
      const metrics = {
        memory: {
          used: 1024,
          total: 4096
        },
        cpu: {
          usage: 50
        }
      };

      metricsService.updateResourceUsage(metrics);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Updating resource usage metrics',
        expect.objectContaining({
          cpuUsage: metrics.cpu.usage,
          memoryUsage: metrics.memory.used,
          memoryTotal: metrics.memory.total
        })
      );
    });
  });

  describe('updateSearchQuality', () => {
    it('should update search quality metrics', () => {
      const metrics = {
        relevance: 0.9,
        conversion_rate: 0.8,
        click_through_rate: 0.7,
        query_hash: 'test-query'
      };

      metricsService.updateSearchQuality(metrics);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Updating search quality metrics',
        expect.objectContaining(metrics)
      );
    });
  });

  describe('recordAlert', () => {
    it('should record metric alerts', () => {
      const alertData = {
        threshold: 100,
        value: 150,
        actual: 150,
        severity: 'warning' as const
      };

      metricsService.recordAlert('test-metric', alertData);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Recording metric alert',
        expect.objectContaining({
          metric: 'test-metric',
          ...alertData
        })
      );
    });
  });

  describe('updateCacheHitRatio', () => {
    it('should update cache hit ratio metrics', () => {
      metricsService.updateCacheHitRatio(80, 20);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Updating cache hit ratio',
        expect.objectContaining({
          hits: 80,
          misses: 20,
          ratio: 0.8
        })
      );
    });
  });

  describe('recordReportDistribution', () => {
    it('should record report distribution metrics', () => {
      const params = {
        report_type: 'test-report',
        recipient_count: 2,
        type: 'distribution',
        timeWindow: '1h'
      };

      metricsService.recordReportDistribution(params);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Recording report distribution',
        expect.objectContaining(params)
      );
    });
  });
});