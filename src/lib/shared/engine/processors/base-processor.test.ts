import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseProcessor } from './base-processor';
import type { LearningEvent, LearningPattern } from '@prisma/client';
import type { Logger } from '@/lib/shared/types';
import type { MetricsAdapter } from '../adapters/metrics-adapter';

// Mock Prisma client enums
const mockPrismaEnums = {
  LearningEventType: {
    SYSTEM_STATE: 'SYSTEM_STATE',
    METRIC_THRESHOLD: 'METRIC_THRESHOLD'
  },
  LearningEventStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    IGNORED: 'IGNORED'
  },
  LearningEventPriority: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
  }
} as const;

vi.mock('@prisma/client', () => mockPrismaEnums);

// Create a concrete implementation of BaseProcessor for testing
class TestProcessor extends BaseProcessor {
  protected calculateConfidence(pattern: Partial<LearningPattern>): number {
    const features = pattern.features as Record<string, number> | undefined;
    if (!features || Object.keys(features).length === 0) {
      return 0;
    }

    const metrics = Object.values(features);
    if (metrics.some(v => v < 0)) {
      return 0;
    }

    const avgMetric = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    return Math.min(avgMetric, 1);
  }

  async analyze(events: LearningEvent[]): Promise<LearningPattern[]> {
    const pattern: LearningPattern = {
      id: 'test-pattern',
      type: 'TEST',
      confidence: 0,
      features: events.length ? { metric1: 0.5, metric2: 0.7 } : {},
      metadata: {},
      eventId: events[0]?.id || 'default',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    pattern.confidence = this.calculateConfidence(pattern);
    return [pattern];
  }
}

describe('BaseProcessor', () => {
  let processor: TestProcessor;
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

    processor = new TestProcessor(mockLogger, mockMetrics);
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence correctly with valid metrics', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'TEST',
        confidence: 0.8,
        features: { metric1: 0.5, metric2: 0.7 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const confidence = processor['calculateConfidence'](pattern);

      // Assert
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty metrics object', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'TEST',
        confidence: 0,
        features: {},
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const confidence = processor['calculateConfidence'](pattern);

      // Assert
      expect(confidence).toBe(0);
    });

    it('should handle negative metric values', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'TEST',
        confidence: 0,
        features: { metric1: -0.5, metric2: -0.3 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const confidence = processor['calculateConfidence'](pattern);

      // Assert
      expect(confidence).toBe(0);
    });

    it('should handle extremely high metric values', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'TEST',
        confidence: 1,
        features: { metric1: 100, metric2: 1000 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const confidence = processor['calculateConfidence'](pattern);

      // Assert
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('analyze', () => {
    it('should analyze events and return patterns', async () => {
      // Arrange
      const baseEvent = {
        id: 'test-event',
        type: mockPrismaEnums.LearningEventType.SYSTEM_STATE,
        status: mockPrismaEnums.LearningEventStatus.PENDING,
        priority: mockPrismaEnums.LearningEventPriority.MEDIUM,
        timestamp: new Date(),
        metadata: { state: 'active' },
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
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        type: 'TEST',
        features: { metric1: 0.5, metric2: 0.7 },
        eventId: 'test-event'
      });
    });

    it('should handle empty events array', async () => {
      // Arrange
      const events: LearningEvent[] = [];

      // Act
      const patterns = await processor.analyze(events);

      // Assert
      expect(patterns).toBeDefined();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].eventId).toBe('default');
    });
  });
});
