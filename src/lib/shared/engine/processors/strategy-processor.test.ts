import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrategyProcessor } from './strategy-processor';
import { Logger } from '../../types';
import { MetricsAdapter } from '../adapters/metrics-adapter';
import { PrismaClient, LearningPattern, EngineOptimizationType, EngineOptimizationStrategy } from '@prisma/client';

// Mock Prisma client
const mockPrismaClient = {
  searchConfig: {
    upsert: vi.fn().mockResolvedValue({}),
  },
  engineLearningResult: {
    update: vi.fn().mockResolvedValue({}),
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
  EngineOptimizationType: {
    WEIGHT_ADJUSTMENT: 'WEIGHT_ADJUSTMENT',
    QUERY_TRANSFORMATION: 'QUERY_TRANSFORMATION',
    INDEX_OPTIMIZATION: 'INDEX_OPTIMIZATION',
    CACHE_STRATEGY: 'CACHE_STRATEGY'
  },
  EngineRiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  },
  EngineOperationType: {
    PATTERN_DETECTION: 'PATTERN_DETECTION',
    STRATEGY_GENERATION: 'STRATEGY_GENERATION',
    STRATEGY_EXECUTION: 'STRATEGY_EXECUTION'
  },
  EngineOperationStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  OptimizationStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  StrategyType: {
    AUTOMATED: 'AUTOMATED',
    MANUAL: 'MANUAL',
    HYBRID: 'HYBRID'
  }
}));

describe('StrategyProcessor', () => {
  let strategyProcessor: StrategyProcessor;
  let mockLogger: Logger;
  let mockMetricsAdapter: MetricsAdapter;
  let prisma: PrismaClient;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    mockMetricsAdapter = {
      recordMetric: vi.fn(),
    } as unknown as MetricsAdapter;

    prisma = new PrismaClient();
    strategyProcessor = new StrategyProcessor(mockLogger, mockMetricsAdapter, prisma);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('generateStrategies', () => {
    it('should generate strategies for high relevance search pattern', async () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'high_relevance_search',
        confidence: 0.8,
        features: { took: 50 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const strategies = await strategyProcessor.generateStrategies(pattern);

      // Assert
      expect(strategies).toHaveLength(2);
      expect(strategies[0]).toMatchObject({
        type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
        priority: pattern.confidence,
        confidence: pattern.confidence,
        metadata: expect.objectContaining({
          targetMetrics: ['RELEVANCE_SCORE', 'SEARCH_LATENCY'],
        }),
      });
      expect(strategies[1]).toMatchObject({
        type: EngineOptimizationType.QUERY_TRANSFORMATION,
        priority: pattern.confidence * 0.9,
        metadata: expect.objectContaining({
          targetMetrics: ['SEARCH_LATENCY'],
        }),
      });
    });

    it('should not generate query transformation strategy for slow patterns', async () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'high_relevance_search',
        confidence: 0.8,
        features: { took: 150 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const strategies = await strategyProcessor.generateStrategies(pattern);

      // Assert
      expect(strategies).toHaveLength(1);
      expect(strategies[0].type).toBe(EngineOptimizationType.WEIGHT_ADJUSTMENT);
    });
  });

  describe('executeStrategy', () => {
    it('should execute weight adjustment strategy successfully', async () => {
      // Arrange
      const strategy: EngineOptimizationStrategy = {
        id: 'test-strategy',
        type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
        priority: 0.8,
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          weights: { field1: 1.5, field2: 0.8 },
        },
        learningResultId: 'test-result',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      await strategyProcessor.executeStrategy(strategy);

      // Assert
      expect(mockPrismaClient.searchConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'weightAdjustments' },
        create: expect.any(Object),
        update: expect.any(Object),
      });
      expect(mockPrismaClient.engineLearningResult.update).toHaveBeenCalled();
    });

    it('should execute query transformation strategy successfully', async () => {
      // Arrange
      const strategy: EngineOptimizationStrategy = {
        id: 'test-strategy',
        type: EngineOptimizationType.QUERY_TRANSFORMATION,
        priority: 0.8,
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          transformations: ['boost_exact_matches', 'expand_synonyms'],
        },
        learningResultId: 'test-result',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      await strategyProcessor.executeStrategy(strategy);

      // Assert
      expect(mockPrismaClient.searchConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'queryTransformations' },
        create: expect.any(Object),
        update: expect.any(Object),
      });
      expect(mockPrismaClient.engineLearningResult.update).toHaveBeenCalled();
    });

    it('should execute index optimization strategy successfully', async () => {
      // Arrange
      const strategy: EngineOptimizationStrategy = {
        id: 'test-strategy',
        type: EngineOptimizationType.INDEX_OPTIMIZATION,
        priority: 0.8,
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          indexSettings: { refresh_interval: '30s' },
        },
        learningResultId: 'test-result',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      await strategyProcessor.executeStrategy(strategy);

      // Assert
      expect(mockPrismaClient.searchConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'indexConfigurations' },
        create: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should execute cache strategy successfully', async () => {
      // Arrange
      const strategy: EngineOptimizationStrategy = {
        id: 'test-strategy',
        type: EngineOptimizationType.CACHE_STRATEGY,
        priority: 0.8,
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          cacheSettings: { ttl: 3600 },
        },
        learningResultId: 'test-result',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      await strategyProcessor.executeStrategy(strategy);

      // Assert
      expect(mockPrismaClient.searchConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'cacheConfigurations' },
        create: expect.any(Object),
        update: expect.any(Object),
      });
    });
  });

  describe('Pattern Analysis', () => {
    it('should identify high performance patterns', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'search',
        confidence: 0.8,
        features: { took: 50 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const isHighPerformance = strategyProcessor['isHighPerformancePattern'](pattern);

      // Assert
      expect(isHighPerformance).toBe(true);
    });

    it('should identify slow query patterns', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'search',
        confidence: 0.8,
        features: { took: 600 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const isSlowQuery = strategyProcessor['isSlowQueryPattern'](pattern);

      // Assert
      expect(isSlowQuery).toBe(true);
    });

    it('should identify high traffic patterns', () => {
      // Arrange
      const pattern: LearningPattern = {
        id: 'test-pattern',
        type: 'search',
        confidence: 0.8,
        features: { totalHits: 1500 },
        metadata: {},
        eventId: 'test-event',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const isHighTraffic = strategyProcessor['isHighTrafficPattern'](pattern);

      // Assert
      expect(isHighTraffic).toBe(true);
    });
  });
});
