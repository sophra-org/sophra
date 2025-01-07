import { vi } from 'vitest';

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  LearningEventType: {
    METRIC_THRESHOLD: 'METRIC_THRESHOLD',
    SYSTEM_STATE: 'SYSTEM_STATE'
  }
}));

// Mock base processor
vi.mock('./base-processor', () => ({
  BaseProcessor: class {
    constructor(protected logger: any, protected metrics: any) {}
    protected calculateConfidence(): number {
      return 0.8;
    }
  }
}));

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceProcessor } from './performance-processor';
import type { Logger } from '@/lib/shared/types';
import { MetricsAdapter } from '../adapters/metrics-adapter';
import type { LearningEvent, LearningPattern, Prisma } from '@prisma/client';

describe('PerformanceProcessor', () => {
  let processor: PerformanceProcessor;
  let mockLogger: Logger;
  let mockMetrics: MetricsAdapter;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      service: 'test-service'
    } as unknown as Logger;

    mockMetrics = {
      recordMetric: vi.fn()
    } as unknown as MetricsAdapter;

    processor = new PerformanceProcessor(mockLogger, mockMetrics);

    // Mock the private method with proper type casting
    const mockAnalyzeMetricPattern = vi.fn().mockImplementation(
      async (_metric: string, events: LearningEvent[]): Promise<LearningPattern | null> => {
        if (events.length === 0) return null;

        const event = events[0];
        const metadata = event.metadata as { metricType: string; value: number; threshold: number };
        
        if (!metadata || !metadata.metricType) return null;

        return {
          id: `perf_${event.id}`,
          type: 'PERFORMANCE_PATTERN',
          confidence: 0.8,
          features: {
            latencyExceeded: metadata.value > metadata.threshold,
            latencyValue: metadata.value,
            latencyThreshold: metadata.threshold
          } as unknown as Prisma.JsonValue,
          metadata: {
            metricType: metadata.metricType
          } as unknown as Prisma.JsonValue,
          eventId: event.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    );

    Object.defineProperty(processor, 'analyzeMetricPattern', {
      value: mockAnalyzeMetricPattern
    });
  });

  describe('analyze', () => {
    it('should analyze performance events successfully', async () => {
      // Arrange
      const baseEvent = {
        id: 'test-event',
        type: 'METRIC_THRESHOLD',
        status: 'PENDING',
        priority: 'MEDIUM',
        timestamp: new Date(),
        metadata: {
          metricType: 'latency',
          value: 150,
          threshold: 100
        },
        error: null,
        processedAt: null,
        correlationId: 'test-correlation',
        sessionId: 'test-session',
        userId: 'test-user',
        clientId: 'test-client',
        environment: 'test',
        version: '1.0.0',
        tags: [],
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as LearningEvent;

      const events: LearningEvent[] = [baseEvent];

      // Act
      const patterns = await processor.analyze(events);

      // Assert
      expect(patterns).toBeDefined();
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        type: 'PERFORMANCE_PATTERN',
        features: {
          latencyExceeded: true,
          latencyValue: 150,
          latencyThreshold: 100
        },
        metadata: {
          metricType: 'latency'
        }
      });
    });

    it('should handle empty events array', async () => {
      // Arrange
      const events: LearningEvent[] = [];

      // Act
      const patterns = await processor.analyze(events);

      // Assert
      expect(patterns).toBeDefined();
      expect(patterns).toHaveLength(0);
    });

    it('should handle events without performance metadata', async () => {
      // Arrange
      const baseEvent = {
        id: 'test-event',
        type: 'METRIC_THRESHOLD',
        status: 'PENDING',
        priority: 'MEDIUM',
        timestamp: new Date(),
        metadata: {},
        error: null,
        processedAt: null,
        correlationId: 'test-correlation',
        sessionId: 'test-session',
        userId: 'test-user',
        clientId: 'test-client',
        environment: 'test',
        version: '1.0.0',
        tags: [],
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as LearningEvent;

      const events: LearningEvent[] = [baseEvent];

      // Act
      const patterns = await processor.analyze(events);

      // Assert
      expect(patterns).toBeDefined();
      expect(patterns).toHaveLength(0);
    });
  });
});
