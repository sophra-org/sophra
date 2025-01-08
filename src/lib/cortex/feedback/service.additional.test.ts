import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { FeedbackService } from './service';
import { MetricsService } from '@lib/cortex/monitoring/metrics';
import { AutomatedFeedbackProcessor } from '@lib/cortex/feedback/automated-processor';
import { SearchABTestingService } from '@lib/cortex/feedback/ab-testing';
import { prisma } from '@lib/shared/database/client';
import { JsonValue } from '@prisma/client/runtime/library';
import type { Logger } from '@lib/shared/types';

// Mock dependencies
vi.mock('@lib/cortex/monitoring/metrics', () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    observeSearchFeedback: vi.fn(),
  })),
}));

vi.mock('@lib/cortex/feedback/automated-processor', () => ({
  AutomatedFeedbackProcessor: vi.fn().mockImplementation(() => ({
    processRealTimeFeedback: vi.fn(),
  })),
}));

vi.mock('@lib/cortex/feedback/ab-testing', () => ({
  SearchABTestingService: vi.fn().mockImplementation(() => ({
    trackVariantMetrics: vi.fn(),
  })),
}));

vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    searchEvent: {
      update: vi.fn(),
    },
  },
}));

describe('FeedbackService Additional Tests', () => {
  let service: FeedbackService;
  let mockLogger: { debug: Mock; error: Mock };
  let mockElasticsearch: { search: Mock };

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
    };

    mockElasticsearch = {
      search: vi.fn(),
    };

    service = new FeedbackService({
      prisma,
      logger: mockLogger as unknown as Logger,
      elasticsearch: mockElasticsearch as any,
    });
  });

  describe('Service Initialization', () => {
    it('should initialize with required dependencies', () => {
      expect(MetricsService).toHaveBeenCalledWith({
        logger: mockLogger,
        environment: expect.any(String),
      });

      expect(AutomatedFeedbackProcessor).toHaveBeenCalledWith({
        logger: mockLogger,
        prisma,
        elasticsearch: mockElasticsearch,
        metrics: expect.any(Object),
      });

      expect(SearchABTestingService).toHaveBeenCalledWith({
        logger: mockLogger,
        prisma,
        metrics: expect.any(Object),
      });
    });
  });

  describe('Feedback Recording', () => {
    const validFeedback = {
      searchId: 'test-search-id',
      queryHash: 'test-query-hash',
      resultId: 'test-result-id',
      relevanceScore: 0.8,
      userAction: 'clicked' as const,
      metadata: {},
    };

    it('should record valid feedback', async () => {
      vi.mocked(prisma.searchEvent.update).mockResolvedValue({} as any);

      await service.recordFeedback(validFeedback);

      expect(prisma.searchEvent.update).toHaveBeenCalledWith({
        where: { id: validFeedback.searchId },
        data: {
          filters: {
            set: expect.objectContaining({
              userAction: validFeedback.userAction,
              relevanceScore: validFeedback.relevanceScore,
            }) as JsonValue,
          },
        },
      });
    });

    it('should validate relevance score range', async () => {
      const invalidFeedback = {
        ...validFeedback,
        relevanceScore: 2, // Invalid score
      };

      await expect(service.recordFeedback(invalidFeedback)).rejects.toThrow(
        'Invalid feedback data: relevance score must be between 0 and 1'
      );
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.searchEvent.update).mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.recordFeedback(validFeedback)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });
  });

  describe('Statistics Calculation', () => {
    const mockFeedback = [
      {
        id: 'feedback-1',
        filters: {
          userAction: 'clicked',
          relevanceScore: 0.8,
        } as JsonValue,
      },
      {
        id: 'feedback-2',
        filters: {
          userAction: 'converted',
          relevanceScore: 1.0,
        } as JsonValue,
      },
      {
        id: 'feedback-3',
        filters: {
          userAction: 'ignored',
          relevanceScore: 0.2,
        } as JsonValue,
      },
    ];

    it('should calculate click-through rate correctly', () => {
      const stats = (service as any).calculateFeedbackStats(mockFeedback);
      expect(stats.clickThroughRate).toBe(1 / 3); // 1 click out of 3 events
    });

    it('should calculate average relevance correctly', () => {
      const stats = (service as any).calculateFeedbackStats(mockFeedback);
      expect(stats.averageRelevance).toBe((0.8 + 1.0 + 0.2) / 3);
    });

    it('should calculate conversion rate correctly', () => {
      const stats = (service as any).calculateFeedbackStats(mockFeedback);
      expect(stats.conversionRate).toBe(1 / 3); // 1 conversion out of 3 events
    });

    it('should handle empty feedback array', () => {
      const stats = (service as any).calculateFeedbackStats([]);
      expect(stats).toEqual({
        clickThroughRate: 0,
        averageRelevance: 0,
        conversionRate: 0,
      });
    });

    it('should handle missing relevance scores', () => {
      const incompleteData = [
        {
          id: 'feedback-1',
          filters: {
            userAction: 'clicked',
          } as JsonValue,
        },
      ];

      const stats = (service as any).calculateFeedbackStats(incompleteData);
      expect(stats.averageRelevance).toBe(0);
    });
  });

  describe('Feedback with Optimization', () => {
    const validFeedback = {
      searchId: 'test-search-id',
      queryHash: 'test-query-hash',
      resultId: 'test-result-id',
      relevanceScore: 0.8,
      userAction: 'clicked' as const,
      metadata: {
        testId: 'test-ab-test',
        variantId: 'variant-a',
      },
    };

    it('should process feedback with A/B test data', async () => {
      const abTesting = new SearchABTestingService({} as any);
      vi.mocked(prisma.searchEvent.update).mockResolvedValue({} as any);

      await service.recordFeedbackWithOptimization(validFeedback);

      expect(abTesting.trackVariantMetrics).toHaveBeenCalledWith({
        testId: validFeedback.metadata.testId,
        variantId: validFeedback.metadata.variantId,
        queryHash: validFeedback.queryHash,
        metrics: expect.objectContaining({
          clickThroughRate: 1,
          averageRelevance: validFeedback.relevanceScore,
        }),
      });
    });

    it('should validate test data', async () => {
      const invalidFeedback = {
        ...validFeedback,
        metadata: {
          testId: 'test-ab-test',
          // Missing variantId
        },
      };

      await expect(
        service.recordFeedbackWithOptimization(invalidFeedback)
      ).rejects.toThrow('Invalid test data: missing variantId');
    });

    it('should trigger automated optimization', async () => {
      const automatedProcessor = new AutomatedFeedbackProcessor({} as any);
      vi.mocked(prisma.searchEvent.update).mockResolvedValue({} as any);

      await service.recordFeedbackWithOptimization(validFeedback);

      expect(automatedProcessor.processRealTimeFeedback).toHaveBeenCalledWith(
        validFeedback.queryHash
      );
    });

    it('should handle optimization errors', async () => {
      const automatedProcessor = new AutomatedFeedbackProcessor({} as any);
      vi.mocked(automatedProcessor.processRealTimeFeedback).mockRejectedValue(
        new Error('Processing error')
      );
      vi.mocked(prisma.searchEvent.update).mockResolvedValue({} as any);

      await expect(
        service.recordFeedbackWithOptimization(validFeedback)
      ).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process feedback for optimization',
        expect.any(Object)
      );
    });

    it('should log debug information', async () => {
      vi.mocked(prisma.searchEvent.update).mockResolvedValue({} as any);

      await service.recordFeedbackWithOptimization(validFeedback);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Recording feedback with optimization',
        expect.objectContaining({
          feedback: validFeedback,
        })
      );
    });
  });
});
