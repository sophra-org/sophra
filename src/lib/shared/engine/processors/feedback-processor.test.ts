import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackProcessor } from './feedback-processor';
import type { Logger } from '../../types';
import type { LearningEvent, LearningEventType, LearningEventStatus, LearningEventPriority, PrismaClient } from '@prisma/client';
import type { ElasticsearchService } from '../../../cortex/elasticsearch/services';
import { MetricsAdapter } from '../adapters/metrics-adapter';

// Mock Prisma client enums
const mockPrismaEnums = {
  LearningEventType: {
    USER_FEEDBACK: 'USER_FEEDBACK',
    FEEDBACK_ANALYSIS: 'FEEDBACK_ANALYSIS'
  },
  LearningEventStatus: {
    PENDING: 'PENDING'
  },
  LearningEventPriority: {
    MEDIUM: 'MEDIUM'
  }
} as const;

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
  ...mockPrismaEnums,
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  }
}));

describe('FeedbackProcessor', () => {
  let feedbackProcessor: FeedbackProcessor;
  let mockLogger: Logger;
  let mockElasticsearchService: ElasticsearchService;
  let mockMetricsAdapter: MetricsAdapter;
  let mockPrisma: PrismaClient;
  let mockSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      service: 'test-service'
    } as unknown as Logger;

    mockSearch = vi.fn();
    mockElasticsearchService = {
      search: mockSearch,
      index: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      healthCheck: vi.fn(),
      initialize: vi.fn(),
      disconnect: vi.fn()
    } as unknown as ElasticsearchService;

    mockMetricsAdapter = {
      recordMetric: vi.fn()
    } as unknown as MetricsAdapter;

    mockPrisma = {
      learningEvent: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn()
      }
    } as unknown as PrismaClient;

    feedbackProcessor = new FeedbackProcessor(
      mockLogger,
      mockMetricsAdapter,
      mockElasticsearchService,
      mockPrisma
    );
  });

  describe('analyze', () => {
    const baseEvent = {
      status: mockPrismaEnums.LearningEventStatus.PENDING as LearningEventStatus,
      priority: mockPrismaEnums.LearningEventPriority.MEDIUM as LearningEventPriority,
      processedAt: null,
      correlationId: 'test-correlation',
      sessionId: 'test-session',
      userId: 'test-user',
      clientId: 'test-client',
      environment: 'test',
      version: '1.0.0',
      tags: [] as string[],
      error: null,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as const;

    it('should analyze user feedback events successfully', async () => {
      // Arrange
      const events: LearningEvent[] = [{
        ...baseEvent,
        id: 'test-event-1',
        type: mockPrismaEnums.LearningEventType.USER_FEEDBACK as LearningEventType,
        timestamp: new Date(),
        metadata: {
          feedbackType: 'relevance',
          score: 4,
          searchId: 'test-search'
        }
      } as LearningEvent];

      const mockSearchResult = {
        hits: {
          hits: [{
            _source: {
              query: 'test query',
              results: ['doc1', 'doc2']
            }
          }]
        }
      };

      mockSearch.mockResolvedValue(mockSearchResult);

      // Act
      const patterns = await feedbackProcessor.analyze(events);

      // Assert
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        type: 'USER_FEEDBACK_PATTERN',
        features: expect.objectContaining({
          score: 4
        }),
        metadata: expect.objectContaining({
          feedbackType: 'relevance'
        })
      });
      expect(mockSearch).toHaveBeenCalled();
    });

    it('should handle empty events array', async () => {
      // Arrange
      const events: LearningEvent[] = [];

      // Act
      const patterns = await feedbackProcessor.analyze(events);

      // Assert
      expect(patterns).toHaveLength(0);
    });

    it('should handle events without feedback metadata', async () => {
      // Arrange
      const events: LearningEvent[] = [{
        ...baseEvent,
        id: 'test-event-3',
        type: mockPrismaEnums.LearningEventType.USER_FEEDBACK as LearningEventType,
        timestamp: new Date(),
        metadata: {}
      } as LearningEvent];

      const mockSearchResult = {
        hits: {
          hits: []
        }
      };

      mockSearch.mockResolvedValue(mockSearchResult);

      // Act
      const patterns = await feedbackProcessor.analyze(events);

      // Assert
      expect(patterns).toHaveLength(0);
    });
  });
});
