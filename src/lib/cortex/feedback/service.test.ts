import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackService } from './service';
import type { SearchFeedbackData } from './service';
import type { Logger } from '@/lib/shared/types';
import type { ElasticsearchService } from '@/lib/cortex/elasticsearch/services';
import { prisma } from '@/lib/shared/database/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { MetricsService } from '@/lib/cortex/monitoring/metrics';

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    searchEvent: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockSearchEvent = {
  id: '123',
  query: 'test query',
  sessionId: 'session-123',
  searchType: 'semantic',
  totalHits: 10,
  took: 50,
  timestamp: new Date('2024-01-01T00:00:00Z'),
  facetsUsed: {} as JsonValue,
  resultIds: ['result-1', 'result-2'] as JsonValue,
  page: 1,
  pageSize: 10,
  filters: {
    userAction: 'clicked',
    relevanceScore: 0.95,
    metadata: {},
  } as JsonValue,
};

const mockFeedbackData: SearchFeedbackData = {
  searchId: 'search-123',
  queryHash: 'query-hash-123',
  resultId: 'result-123',
  relevanceScore: 0.95,
  userAction: 'clicked',
  metadata: {},
};

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;
  let mockLogger: Logger;
  let mockElasticsearch: jest.Mocked<ElasticsearchService>;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      service: 'feedback-service',
      silent: false,
      format: vi.fn(),
      levels: {},
    } as unknown as Logger;

    mockElasticsearch = {
      search: vi.fn(),
      upsertDocument: vi.fn(),
      deleteDocument: vi.fn(),
      indexExists: vi.fn(),
      createIndex: vi.fn(),
    } as unknown as jest.Mocked<ElasticsearchService>;

    feedbackService = new FeedbackService({
      prisma,
      logger: mockLogger,
      elasticsearch: mockElasticsearch,
    });
  });

  describe('recordFeedback', () => {
    it('should record feedback successfully', async () => {
      vi.spyOn(prisma.searchEvent, 'update').mockResolvedValue(mockSearchEvent);

      await feedbackService.recordFeedback(mockFeedbackData);

      expect(prisma.searchEvent.update).toHaveBeenCalledWith({
        where: { id: mockFeedbackData.searchId },
        data: {
          filters: {
            set: {
              userAction: mockFeedbackData.userAction,
              relevanceScore: mockFeedbackData.relevanceScore,
              metadata: mockFeedbackData.metadata,
            },
          },
        },
      });
    });

    it('should handle feedback recording errors', async () => {
      const mockError = new Error('Database error');
      vi.spyOn(prisma.searchEvent, 'update').mockRejectedValue(mockError);

      await expect(feedbackService.recordFeedback(mockFeedbackData))
        .rejects.toThrow('Database error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.objectContaining({
          error: mockError,
          feedback: mockFeedbackData,
        })
      );
    });

    it('should validate feedback data format', async () => {
      const invalidFeedback = {
        ...mockFeedbackData,
        relevanceScore: -1, // Invalid score
      };

      await expect(feedbackService.recordFeedback(invalidFeedback))
        .rejects.toThrow('Invalid feedback data: relevance score must be between 0 and 1');
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection error');
      vi.spyOn(prisma.searchEvent, 'update').mockRejectedValue(mockError);

      await expect(feedbackService.recordFeedback(mockFeedbackData))
        .rejects.toThrow('Database connection error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.objectContaining({
          error: mockError,
          feedback: mockFeedbackData,
        })
      );
    });

    it('should handle elasticsearch integration errors', async () => {
      const mockError = new Error('Elasticsearch error');
      vi.spyOn(prisma.searchEvent, 'update').mockResolvedValue(mockSearchEvent);
      vi.spyOn(feedbackService['metrics'], 'observeSearchFeedback').mockRejectedValue(mockError);

      await expect(feedbackService.recordFeedback(mockFeedbackData))
        .rejects.toThrow('Elasticsearch error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.objectContaining({
          error: mockError,
          feedback: mockFeedbackData,
        })
      );
    });
  });

  describe('recordFeedbackWithOptimization', () => {
    it('should record feedback and trigger optimization', async () => {
      vi.spyOn(prisma.searchEvent, 'update').mockResolvedValue(mockSearchEvent);
      vi.spyOn(feedbackService['automatedProcessor'], 'processRealTimeFeedback').mockResolvedValue();

      await feedbackService.recordFeedbackWithOptimization(mockFeedbackData);

      expect(prisma.searchEvent.update).toHaveBeenCalled();
      expect(feedbackService['automatedProcessor'].processRealTimeFeedback)
        .toHaveBeenCalledWith(mockFeedbackData.queryHash);
    });

    it('should handle optimization errors', async () => {
      const mockError = new Error('Optimization error');
      vi.spyOn(feedbackService['automatedProcessor'], 'processRealTimeFeedback')
        .mockRejectedValue(mockError);

      await expect(feedbackService.recordFeedbackWithOptimization(mockFeedbackData))
        .rejects.toThrow('Optimization error');
    });

    it('should track A/B test metrics when test data is present', async () => {
      const feedbackWithTest = {
        ...mockFeedbackData,
        metadata: {
          testId: 'test-1',
          variantId: 'variant-a',
        },
      };

      vi.spyOn(prisma.searchEvent, 'update').mockResolvedValue(mockSearchEvent);
      vi.spyOn(feedbackService['automatedProcessor'], 'processRealTimeFeedback').mockResolvedValue();
      vi.spyOn(feedbackService['abTesting'], 'trackVariantMetrics').mockResolvedValue();

      await feedbackService.recordFeedbackWithOptimization(feedbackWithTest);

      expect(feedbackService['abTesting'].trackVariantMetrics).toHaveBeenCalledWith({
        testId: 'test-1',
        variantId: 'variant-a',
        queryHash: feedbackWithTest.queryHash,
        metrics: expect.any(Object),
      });
    });

    it('should validate test data format when present', async () => {
      const invalidTestData: SearchFeedbackData = {
        searchId: 'test-123',
        queryHash: 'test-hash',
        resultId: 'result-123',
        relevanceScore: 1,
        userAction: 'clicked',
        metadata: {
          testId: 'test-123',
          // Missing variantId intentionally to test validation
          metrics: {
            relevance: 1,
          },
        },
      };

      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        service: 'test',
        http: vi.fn(),
        verbose: vi.fn(),
        silent: false,
        format: {},
        levels: {},
        level: 'info',
      } as unknown as Logger;

      const mockElasticsearch = {
        search: vi.fn(),
        upsertDocument: vi.fn(),
        deleteDocument: vi.fn(),
        indexExists: vi.fn(),
        createIndex: vi.fn(),
      } as unknown as ElasticsearchService;

      const service = new FeedbackService({
        logger: mockLogger,
        elasticsearch: mockElasticsearch,
        prisma,
      });

      await expect(service.recordFeedbackWithOptimization(invalidTestData))
        .rejects.toThrow('Invalid test data: missing variantId');
    });

    it('should handle optimization service errors', async () => {
      const mockError = new Error('Optimization service unavailable');
      vi.spyOn(feedbackService['automatedProcessor'], 'processRealTimeFeedback')
        .mockRejectedValue(mockError);

      await expect(feedbackService.recordFeedbackWithOptimization(mockFeedbackData))
        .rejects.toThrow('Optimization service unavailable');
    });
  });
});