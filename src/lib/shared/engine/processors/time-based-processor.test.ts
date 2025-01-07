import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import type { LearningEvent, Prisma } from '@prisma/client';
import { TimeBasedProcessor, type TimeSeriesData, type TemporalCorrelations, type RecurringPatterns } from './time-based-processor';
import type { Logger } from '@/lib/shared/types';
import type { MetricsAdapter } from '../adapters/metrics-adapter';

type JsonValue = Prisma.JsonValue;

// Mock Prisma client
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual<any>('@prisma/client');
  return {
    ...actual,
    LearningEventType: {
      SYSTEM_STATE: 'SYSTEM_STATE',
      METRIC_THRESHOLD: 'METRIC_THRESHOLD'
    }
  };
});

describe('TimeBasedProcessor', () => {
  let processor: TimeBasedProcessor;
  let mockLogger: Logger;
  let mockMetrics: Mocked<MetricsAdapter>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      service: 'test'
    } as unknown as Logger;

    mockMetrics = {
      recordEngineMetric: vi.fn(),
      recordLearningMetrics: vi.fn()
    } as unknown as Mocked<MetricsAdapter>;

    processor = new TimeBasedProcessor(mockLogger, mockMetrics);
  });

  describe('analyze', () => {
    it('should analyze time-based events', async () => {
      const { LearningEventType } = await import('@prisma/client');
      
      const timeSeriesData = [
        { timestamp: new Date('2024-01-01T10:00:00Z'), value: 100 },
        { timestamp: new Date('2024-01-01T10:05:00Z'), value: 150 }
      ];

      const metadata = {
        metric: 'latency',
        value: 100,
        timeSeriesData
      };

      const events: Partial<LearningEvent>[] = [
        {
          id: 'event1',
          type: LearningEventType.SYSTEM_STATE,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metadata: metadata as unknown as JsonValue,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const patterns = await processor.analyze(events as LearningEvent[]);
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toMatchObject({
        type: expect.any(String),
        confidence: expect.any(Number),
        features: expect.any(Object)
      });
    });

    it('should handle empty event list', async () => {
      const patterns = await processor.analyze([]);
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('getTimeSeriesData', () => {
    it('should retrieve time series data', async () => {
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
        granularity: '1h'
      };

      const data = await processor.getTimeSeriesData(params);
      expect(data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data[0]).toHaveProperty('x');
      expect(data.data[0]).toHaveProperty('y');
    });

    it('should validate time range parameters', async () => {
      const invalidParams = {
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-01'), // End before start
        granularity: '1h'
      };

      await expect(processor.getTimeSeriesData(invalidParams))
        .rejects.toThrow(/invalid time range/i);
    });
  });

  describe('analyzeCorrelations', () => {
    it('should analyze correlations in time series data', async () => {
      const timeSeriesData: TimeSeriesData = {
        data: [
          { x: new Date('2024-01-01T10:00:00Z'), y: 100 },
          { x: new Date('2024-01-01T10:05:00Z'), y: 150 }
        ]
      };

      const correlations = await processor.analyzeCorrelations(timeSeriesData);
      expect(correlations).toBeDefined();
      expect(correlations.correlations).toBeDefined();
      expect(correlations.correlations[0]).toHaveProperty('coefficient');
    });

    it('should handle empty time series data', async () => {
      const emptyData: TimeSeriesData = {
        data: []
      };
      const correlations = await processor.analyzeCorrelations(emptyData);
      expect(correlations).toBeDefined();
      expect(correlations.correlations).toHaveLength(0);
    });
  });

  describe('findRecurringPatterns', () => {
    it('should find recurring patterns', async () => {
      const params = {
        timeframe: '24h',
        minConfidence: 0.8
      };

      const result = await processor.findRecurringPatterns(params);
      expect(result).toBeDefined();
      expect(result.daily).toBeDefined();
      expect(result.weekly).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(params.minConfidence);
    });

    it('should validate pattern search parameters', async () => {
      const invalidParams = {
        timeframe: '-1h',
        minConfidence: 2.0
      };

      await expect(processor.findRecurringPatterns(invalidParams))
        .rejects.toThrow(/invalid parameters/i);
    });

    it('should handle minimum confidence threshold', async () => {
      const params = {
        timeframe: '24h',
        minConfidence: 0.95
      };

      const result = await processor.findRecurringPatterns(params);
      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      result.daily.forEach((pattern: { confidence: number }) => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0.95);
      });
      result.weekly.forEach((pattern: { confidence: number }) => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(0.95);
      });
    });
  });

  describe('time series analysis', () => {
    const createTimeSeriesEvent = (data: Array<{ timestamp: Date; value: number }>): LearningEvent => ({
      id: 'event1',
      type: 'SYSTEM_STATE',
      timestamp: new Date(),
      metadata: { timeSeriesData: data } as unknown as JsonValue,
      createdAt: new Date(),
      updatedAt: new Date()
    } as LearningEvent);

    it('should detect seasonal patterns', async () => {
      const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(2024, 0, 1, i),
        value: Math.sin(i * Math.PI / 12) + 51 // Creates a daily pattern with high values
      }));

      const patterns = await processor.analyze([createTimeSeriesEvent(timeSeriesData)]);
      const hasSeasonalPattern = patterns.some(p => 
        p.type.includes('SEASONAL') || 
        (p.features as Record<string, unknown>).pattern === 'seasonal'
      );
      expect(hasSeasonalPattern).toBe(true);
    });

    it('should detect trend patterns', async () => {
      const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(2024, 0, 1, i),
        value: i * 2 // Creates a strong upward trend
      }));

      const patterns = await processor.analyze([createTimeSeriesEvent(timeSeriesData)]);
      const hasTrendPattern = patterns.some(p => 
        p.type.includes('TREND') || 
        (p.features as Record<string, unknown>).pattern === 'trend'
      );
      expect(hasTrendPattern).toBe(true);
    });

    it('should detect anomalies', async () => {
      const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(2024, 0, 1, i),
        value: i === 12 ? 100 : 1 // Creates a spike at noon
      }));

      const patterns = await processor.analyze([createTimeSeriesEvent(timeSeriesData)]);
      const hasAnomalyPattern = patterns.some(p => 
        p.type.includes('ANOMALY') || 
        (p.features as Record<string, unknown>).pattern === 'anomaly'
      );
      expect(hasAnomalyPattern).toBe(true);
    });
  });
});
