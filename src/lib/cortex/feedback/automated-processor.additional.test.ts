import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomatedFeedbackProcessor } from './automated-processor';
import type { Logger } from '@/lib/shared/types';
import type { ElasticsearchService } from '@/lib/cortex/elasticsearch/services';
import type { MetricsService } from '@/lib/cortex/monitoring/metrics';
import { prisma } from '@/lib/shared/database/client';
import { LearningEventType } from '@prisma/client';
import type { SearchEvent } from '@/lib/shared/database/validation/generated';

describe('AutomatedFeedbackProcessor Additional Tests', () => {
  let processor: AutomatedFeedbackProcessor;
  let mockLogger: Logger;
  let mockElasticsearch: ElasticsearchService;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    mockElasticsearch = {
      getSearchWeights: vi.fn(),
      updateWeights: vi.fn(),
      search: vi.fn(),
    } as unknown as ElasticsearchService;

    mockMetrics = {
      updateSearchQuality: vi.fn(),
    } as unknown as MetricsService;

    processor = new AutomatedFeedbackProcessor({
      logger: mockLogger,
      prisma,
      elasticsearch: mockElasticsearch,
      metrics: mockMetrics,
    });

    vi.clearAllMocks();
  });

  describe('Real-time Feedback Processing', () => {
    it('should process feedback and adjust weights when needed', async () => {
      const mockSearchEvent = {
        id: 'search-1',
        query: 'test query',
        timestamp: new Date(),
        filters: {
          userAction: 'clicked',
          relevanceScore: 0.3,
        },
        sessionId: 'session-1',
        searchType: 'semantic',
        totalHits: 10,
        took: 50,
        facetsUsed: {},
        resultIds: [],
        page: 1,
        pageSize: 10,
      };

      vi.spyOn(prisma.searchEvent, 'findMany').mockResolvedValue([mockSearchEvent] as any);
      vi.spyOn(mockElasticsearch, 'getSearchWeights').mockResolvedValue({
        title: 1,
        content: 1,
      });

      await processor.processRealTimeFeedback('search-1');

      expect(mockElasticsearch.updateWeights).toHaveBeenCalled();
      expect(mockMetrics.updateSearchQuality).toHaveBeenCalled();
    });

    it('should handle empty feedback data', async () => {
      vi.spyOn(prisma.searchEvent, 'findMany').mockResolvedValue([]);

      await processor.processRealTimeFeedback('search-1');

      expect(mockElasticsearch.updateWeights).not.toHaveBeenCalled();
      expect(mockMetrics.updateSearchQuality).toHaveBeenCalledWith({
        relevance: 0,
        conversion_rate: 0,
        click_through_rate: 0,
      });
    });

    it('should handle errors during processing', async () => {
      vi.spyOn(prisma.searchEvent, 'findMany').mockRejectedValue(new Error('Database error'));

      await expect(processor.processRealTimeFeedback('search-1')).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process real-time feedback',
        expect.any(Object)
      );
    });
  });

  describe('Feedback Metrics Calculation', () => {
    it('should calculate metrics correctly for mixed feedback', () => {
      const feedback = [
        {
          searchId: '1',
          queryHash: '1',
          resultId: '1',
          relevanceScore: 0.8,
          userAction: 'clicked',
          metadata: {},
        },
        {
          searchId: '2',
          queryHash: '2',
          resultId: '2',
          relevanceScore: 0.9,
          userAction: 'converted',
          metadata: {},
        },
        {
          searchId: '3',
          queryHash: '3',
          resultId: '3',
          relevanceScore: 0.4,
          userAction: 'ignored',
          metadata: {},
        },
      ];

      const metrics = (processor as any).calculateFeedbackMetrics(feedback);

      expect(metrics.clickThroughRate).toBe(1/3);
      expect(metrics.averageRelevance).toBe(0.7);
      expect(metrics.conversionRate).toBe(1/3);
      expect(metrics.requiresAdjustment).toBe(false);
    });

    it('should flag for adjustment when metrics are poor', () => {
      const feedback = [
        {
          searchId: '1',
          queryHash: '1',
          resultId: '1',
          relevanceScore: 0.3,
          userAction: 'ignored',
          metadata: {},
        },
      ];

      const metrics = (processor as any).calculateFeedbackMetrics(feedback);
      expect(metrics.requiresAdjustment).toBe(true);
    });
  });

  describe('Weight Adjustments', () => {
    it('should compute weight adjustments based on metrics', () => {
      const currentWeights = {
        title: 1.0,
        content: 1.0,
      };

      const metrics = {
        clickThroughRate: 0.1, // Poor click-through rate
        averageRelevance: 0.4, // Poor relevance
        conversionRate: 0.05,
        requiresAdjustment: true,
      };

      const adjustedWeights = (processor as any).computeWeightAdjustments(
        currentWeights,
        metrics
      );

      expect(adjustedWeights.title).toBeGreaterThan(currentWeights.title);
      expect(adjustedWeights.content).toBeGreaterThan(currentWeights.content);
    });

    it('should handle missing weights gracefully', () => {
      const currentWeights = {};
      const metrics = {
        clickThroughRate: 0.1,
        averageRelevance: 0.4,
        conversionRate: 0.05,
        requiresAdjustment: true,
      };

      const adjustedWeights = (processor as any).computeWeightAdjustments(
        currentWeights,
        metrics
      );

      expect(adjustedWeights.title).toBeDefined();
      expect(adjustedWeights.content).toBeDefined();
    });
  });

  describe('Prisma Data Mapping', () => {
    it('should map Prisma data to feedback format', () => {
      const prismaData: SearchEvent[] = [
        {
          id: 'search-1',
          query: 'test',
          timestamp: new Date(),
          filters: {
            userAction: 'clicked',
            relevanceScore: 0.8,
            metadata: { source: 'test' },
          },
          sessionId: 'session-1',
          searchType: 'semantic',
          totalHits: 10,
          took: 50,
          facetsUsed: {},
          resultIds: [],
          page: 1,
          pageSize: 10,
        },
      ];

      const mapped = (processor as any).mapPrismaToFeedbackData(prismaData);

      expect(mapped[0]).toEqual({
        searchId: 'search-1',
        queryHash: 'search-1',
        resultId: 'search-1',
        relevanceScore: 0.8,
        userAction: 'clicked',
        metadata: prismaData[0].filters,
      });
    });

    it('should handle missing or invalid data', () => {
      const prismaData: SearchEvent[] = [
        {
          id: 'search-1',
          query: 'test',
          timestamp: new Date(),
          filters: {}, // Missing userAction and relevanceScore
          sessionId: 'session-1',
          searchType: 'semantic',
          totalHits: 10,
          took: 50,
          facetsUsed: {},
          resultIds: [],
          page: 1,
          pageSize: 10,
        },
      ];

      const mapped = (processor as any).mapPrismaToFeedbackData(prismaData);

      expect(mapped[0]).toEqual({
        searchId: 'search-1',
        queryHash: 'search-1',
        resultId: 'search-1',
        relevanceScore: 0,
        userAction: 'ignored',
        metadata: {},
      });
    });
  });

  describe('Feedback Analysis', () => {
    it('should analyze feedback events and generate patterns', async () => {
      const events = [
        {
          id: 'event-1',
          type: LearningEventType.USER_FEEDBACK,
          metadata: {
            relevantHits: 5,
            totalHits: 10,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'event-2',
          type: LearningEventType.SYSTEM_STATE, // Should be filtered out
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const patterns = await processor.analyzeFeedback(events as any);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        id: expect.stringContaining('feedback_'),
        type: 'USER_FEEDBACK',
        confidence: 0.8,
        eventId: 'event-1',
        features: expect.stringContaining('relevantHits'),
      });
    });

    it('should handle events with invalid metadata', async () => {
      const events = [
        {
          id: 'event-1',
          type: LearningEventType.USER_FEEDBACK,
          metadata: null, // Invalid metadata
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const patterns = await processor.analyzeFeedback(events as any);

      expect(patterns[0].features).toBe(JSON.stringify({
        relevantHits: null,
        totalHits: null,
      }));
    });
  });
});
