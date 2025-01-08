import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { EngineService } from './service';
import { prisma } from '@lib/shared/database/client';
import { EngineOperationType, EngineOperationStatus, EngineStatus, EngineRiskLevel, EngineOptimizationType, type EngineOptimizationStrategy } from './types';
import { LearningEventType, LearningEventStatus } from '@prisma/client';
import Redis from 'ioredis';

// Mock dependencies
vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    engineState: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    engineOperation: {
      create: vi.fn(),
      update: vi.fn(),
    },
    learningEvent: {
      findMany: vi.fn(),
    },
    searchWeights: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    searchConfig: {
      upsert: vi.fn(),
    },
    engineLearningResult: {
      create: vi.fn(),
      update: vi.fn(),
    },
    experimentConfig: {
      create: vi.fn(),
    },
  },
}));

vi.mock('ioredis');

describe('EngineService Additional Tests', () => {
  let service: EngineService;
  let mockLogger: { info: Mock; error: Mock; child: Mock };
  let mockRedis: { xadd: Mock };

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnValue({ info: vi.fn(), error: vi.fn() }),
    };

    mockRedis = {
      xadd: vi.fn(),
    };

    service = new EngineService({
      redis: mockRedis as unknown as Redis,
      logger: mockLogger as any,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    const mockEngineState = {
      id: 'test-state-id',
      status: EngineStatus.READY,
      confidence: 0.8,
      lastActive: new Date(),
      metadata: {},
    };

    it('should initialize successfully', async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue(mockEngineState as any);

      await service.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith('Engine service initialized', {
        status: EngineStatus.READY,
        confidence: 0.8,
      });
    });

    it('should create new state if none exists', async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.engineState.create).mockResolvedValue(mockEngineState as any);

      await service.initialize();

      expect(prisma.engineState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: EngineStatus.READY,
          confidence: 0.8,
        }),
      });
    });

    it('should handle initialization errors', async () => {
      vi.mocked(prisma.engineState.findFirst).mockRejectedValue(new Error('DB error'));

      await expect(service.initialize()).rejects.toThrow('DB error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize engine service',
        expect.any(Object)
      );
    });
  });

  describe('Operation Management', () => {
    const mockOperation = {
      id: 'test-op-id',
      type: EngineOperationType.LEARNING,
      status: EngineOperationStatus.PENDING,
      startTime: new Date(),
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      endTime: null,
      metrics: {},
      metadata: {},
    };

    beforeEach(async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: 'test-state-id',
        status: EngineStatus.READY,
      } as any);
      await service.initialize();
    });

    it('should start operation successfully', async () => {
      vi.mocked(prisma.engineOperation.create).mockResolvedValue(mockOperation as any);

      const operation = await service.startOperation(EngineOperationType.LEARNING);

      expect(operation).toEqual(mockOperation);
      expect(prisma.engineState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EngineStatus.LEARNING,
          }),
        })
      );
    });

    it('should complete operation successfully', async () => {
      const completionData = {
        status: EngineOperationStatus.COMPLETED,
        metrics: { confidence: 0.9 },
      };

      await service.completeOperation('test-op-id', completionData);

      expect(prisma.engineOperation.update).toHaveBeenCalledWith({
        where: { id: 'test-op-id' },
        data: expect.objectContaining({
          status: EngineOperationStatus.COMPLETED,
          endTime: expect.any(Date),
        }),
      });
    });

    it('should handle operation errors', async () => {
      vi.mocked(prisma.engineOperation.create).mockRejectedValue(new Error('Operation error'));

      await expect(service.startOperation(EngineOperationType.LEARNING)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to start operation',
        expect.any(Object)
      );
    });
  });

  describe('Learning Cycle', () => {
    const mockLearningEvents = [
      {
        id: 'event-1',
        type: LearningEventType.SEARCH_PATTERN,
        status: LearningEventStatus.COMPLETED,
        metadata: {
          relevantHits: 80,
          totalHits: 100,
          searchType: 'keyword',
          took: 50,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: 'test-state-id',
        status: EngineStatus.READY,
      } as any);
      await service.initialize();
    });

    it('should execute autonomous learning cycle', async () => {
      vi.mocked(prisma.learningEvent.findMany).mockResolvedValue(mockLearningEvents as any);
      vi.mocked(prisma.engineOperation.create).mockResolvedValue({
        id: 'test-op',
        type: EngineOperationType.LEARNING,
      } as any);

      await service.executeAutonomousLearningCycle();

      expect(prisma.engineLearningResult.create).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Completed autonomous learning cycle',
        expect.any(Object)
      );
    });

    it('should handle empty learning events', async () => {
      vi.mocked(prisma.learningEvent.findMany).mockResolvedValue([]);

      await service.executeAutonomousLearningCycle();

      expect(prisma.engineOperation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EngineOperationStatus.COMPLETED,
            metrics: expect.objectContaining({
              patternCount: 0,
            }),
          }),
        })
      );
    });

    it('should handle learning cycle errors', async () => {
      vi.mocked(prisma.learningEvent.findMany).mockRejectedValue(new Error('Learning error'));

      await service.executeAutonomousLearningCycle();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed autonomous learning cycle',
        expect.any(Object)
      );
    });
  });

  describe('Strategy Management', () => {
    const mockStrategy: EngineOptimizationStrategy = {
      id: 'strategy-1',
      type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
      priority: 0.8,
      confidence: 0.9,
      impact: 0.7,
      metadata: {
        expectedImprovement: 0.15,
        riskLevel: EngineRiskLevel.LOW,
        targetMetrics: ['RELEVANCE_SCORE'],
        dependencies: [],
        searchPattern: 'test-pattern',
      },
      resultId: 'result-1',
      learningResultId: 'learning-1',
    };

    beforeEach(async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: 'test-state-id',
        status: EngineStatus.READY,
        metadata: { riskTolerance: 'low' },
      } as any);
      await service.initialize();
    });

    it('should execute strategy successfully', async () => {
      vi.mocked(prisma.searchWeights.findFirst).mockResolvedValue({
        id: 'weights-1',
        titleWeight: 1.0,
        contentWeight: 1.0,
        tagWeight: 1.0,
        active: true,
      } as any);

      await service.executeStrategy(mockStrategy);

      expect(prisma.engineLearningResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStrategy.learningResultId },
          data: expect.objectContaining({
            validatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should handle high risk strategies appropriately', async () => {
      const highRiskStrategy: EngineOptimizationStrategy = {
        ...mockStrategy,
        metadata: {
          ...mockStrategy.metadata,
          riskLevel: EngineRiskLevel.HIGH,
        },
      };

      await expect(service.executeStrategy(highRiskStrategy)).rejects.toThrow(
        'High risk strategies are not allowed in current state'
      );
    });

    it('should rollback strategy successfully', async () => {
      vi.mocked(prisma.searchWeights.findFirst).mockResolvedValue({
        id: 'weights-1',
        metadata: JSON.stringify({ previousWeights: {} }),
      } as any);

      await service.rollbackStrategyPublic(mockStrategy);

      expect(prisma.engineLearningResult.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStrategy.learningResultId },
          data: expect.objectContaining({
            performance: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Performance Analysis', () => {
    const mockMetrics = {
      latency: 100,
      throughput: 1000,
      errorRate: 0.01,
      cpuUsage: 0.5,
      memoryUsage: 0.4,
    };

    it('should calculate strategy impact correctly', () => {
      const afterMetrics = {
        latency: 80,
        throughput: 1200,
        errorRate: 0.008,
        cpuUsage: 0.55,
        memoryUsage: 0.45,
      };

      const impact = (service as any).calculateStrategyImpact(mockMetrics, afterMetrics);

      expect(impact).toEqual(
        expect.objectContaining({
          isSignificant: expect.any(Boolean),
          improvements: expect.any(Object),
          confidence: expect.any(Number),
        })
      );
    });

    it('should calculate statistical significance', () => {
      const significance = (service as any).calculateStatisticalSignificance(
        mockMetrics,
        {
          ...mockMetrics,
          latency: mockMetrics.latency * 0.7,
        }
      );

      expect(significance).toBeGreaterThan(0);
      expect(significance).toBeLessThanOrEqual(1);
    });

    it('should calculate confidence intervals', () => {
      const improvements = {
        latency: 0.2,
        throughput: 0.15,
        errorRate: 0.1,
      };

      const confidence = (service as any).calculateConfidenceInterval(improvements);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});
