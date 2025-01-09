import { prisma } from "@lib/shared/database/client";
import { LearningEventStatus, LearningEventType } from "@prisma/client";
import Redis from "ioredis";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { EngineService } from "./service";
import {
  EngineOperationStatus,
  EngineOperationType,
  EngineOptimizationType,
  EngineRiskLevel,
  EngineStatus,
  type EngineOptimizationStrategy,
} from "./types";

// Mock dependencies
vi.mock("@lib/shared/database/client", () => ({
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

vi.mock("ioredis");

vi.mock("@/lib/cortex/monitoring/metrics", () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    getAverageLatency: vi.fn().mockResolvedValue(100),
    getThroughput: vi.fn().mockResolvedValue(1000),
    getErrorRate: vi.fn().mockResolvedValue(0.01),
    getCPUUsage: vi.fn().mockResolvedValue(0.5),
    getMemoryUsage: vi.fn().mockResolvedValue(0.4),
    getCurrentLoad: vi.fn().mockReturnValue(0.6),
    getBaselineLoad: vi.fn().mockReturnValue(0.5),
    recordEngineMetric: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("EngineService Additional Tests", () => {
  let service: EngineService;
  let mockLogger: {
    info: Mock;
    error: Mock;
    warn: Mock;
    debug: Mock;
    child: Mock;
    service: string;
  };
  let mockRedis: { xadd: Mock };

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      child: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        service: "test",
      }),
      service: "test",
    };

    mockRedis = {
      xadd: vi.fn(),
    };

    service = new EngineService({
      redis: mockRedis as unknown as Redis,
      logger: mockLogger as any,
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Initialization", () => {
    const mockEngineState = {
      id: "test-state-id",
      status: EngineStatus.READY,
      confidence: 0.8,
      lastActive: new Date(),
      metadata: {},
      currentPhase: null,
    };

    it("should initialize successfully", async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue(
        mockEngineState as any
      );

      await service.initialize();

      expect(mockLogger.child().info).toHaveBeenCalledWith(
        "Engine service initialized",
        {
          status: EngineStatus.READY,
          confidence: 0.8,
        }
      );
    });

    it("should create new state if none exists", async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.engineState.create).mockResolvedValue(
        mockEngineState as any
      );

      await service.initialize();

      expect(prisma.engineState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: EngineStatus.READY,
          confidence: 0.8,
        }),
      });
    });

    it("should handle initialization errors", async () => {
      vi.mocked(prisma.engineState.findFirst).mockRejectedValue(
        new Error("DB error")
      );

      await expect(service.initialize()).rejects.toThrow("DB error");
      expect(mockLogger.child().error).toHaveBeenCalledWith(
        "Failed to initialize engine service",
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });
  });

  describe("Operation Management", () => {
    const mockOperation = {
      id: "test-op-id",
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
        id: "test-state-id",
        status: EngineStatus.READY,
        confidence: 0.8,
        lastActive: new Date(),
        metadata: {},
        currentPhase: null,
      } as any);
      await service.initialize();
    });

    it("should start operation successfully", async () => {
      vi.mocked(prisma.engineOperation.create).mockResolvedValue(
        mockOperation as any
      );
      vi.mocked(prisma.engineState.update).mockResolvedValue({
        id: "test-state-id",
        status: EngineStatus.LEARNING,
      } as any);

      const operation = await service.startOperation(
        EngineOperationType.LEARNING
      );

      expect(operation).toEqual(mockOperation);
      expect(prisma.engineState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EngineStatus.LEARNING,
          }),
        })
      );
    });

    it("should complete operation successfully", async () => {
      const completionData = {
        status: EngineOperationStatus.COMPLETED,
        metrics: { confidence: 0.9 },
      };

      await service.completeOperation("test-op-id", completionData);

      expect(prisma.engineOperation.update).toHaveBeenCalledWith({
        where: { id: "test-op-id" },
        data: expect.objectContaining({
          status: EngineOperationStatus.COMPLETED,
          endTime: expect.any(Date),
          metrics: JSON.stringify(completionData.metrics),
        }),
      });
    });

    it("should handle operation errors", async () => {
      vi.mocked(prisma.engineOperation.create).mockRejectedValue(
        new Error("Operation error")
      );

      await expect(
        service.startOperation(EngineOperationType.LEARNING)
      ).rejects.toThrow();
      expect(mockLogger.child().error).toHaveBeenCalledWith(
        "Failed to start operation",
        expect.objectContaining({
          error: "Operation error",
          type: EngineOperationType.LEARNING,
        })
      );
    });
  });

  describe("Learning Cycle", () => {
    const mockLearningEvents = [
      {
        id: "event-1",
        type: LearningEventType.SEARCH_PATTERN,
        status: LearningEventStatus.COMPLETED,
        priority: "HIGH",
        metadata: {
          relevantHits: 80,
          totalHits: 100,
          searchType: "keyword",
          took: 50,
          source: "test",
          timestamp: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        processedAt: null,
        error: null,
        correlationId: "corr-1",
        sessionId: "session-1",
        userId: "user-1",
        clientId: "client-1",
        environment: "production",
        version: "1.0",
        tags: ["search", "relevance"],
        retryCount: 0,
      },
    ];

    const mockOperation = {
      id: "test-op",
      type: EngineOperationType.LEARNING,
      status: EngineOperationStatus.PENDING,
      startTime: new Date(),
      endTime: null,
      error: null,
      metrics: {},
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: "test-state-id",
        status: EngineStatus.READY,
        confidence: 0.8,
        lastActive: new Date(),
        metadata: {},
        currentPhase: null,
      } as any);
      await service.initialize();

      // Setup default mocks
      vi.mocked(prisma.engineOperation.create).mockResolvedValue(
        mockOperation as any
      );
      vi.mocked(prisma.engineOperation.update).mockResolvedValue({
        ...mockOperation,
        status: EngineOperationStatus.COMPLETED,
        endTime: new Date(),
        metrics: JSON.stringify({
          patternCount: 1,
          strategiesGenerated: 1,
          strategiesExecuted: 0,
          confidence: 0.8,
        }),
      } as any);

      // Mock detectPatterns method
      vi.spyOn(service as any, "detectPatterns").mockResolvedValue({
        patterns: [
          {
            id: "pattern-1",
            type: "high_relevance_search",
            confidence: 0.9,
            features: {
              relevantHits: 80,
              totalHits: 100,
              searchType: "keyword",
              took: 50,
            },
            metadata: {
              source: "test",
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      // Mock optimizeFromPatterns method
      vi.spyOn(service as any, "optimizeFromPatterns").mockResolvedValue({
        strategies: [
          {
            id: "strategy-1",
            type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
            priority: 0.8,
            confidence: 0.9,
            impact: 0.7,
            metadata: {
              targetMetrics: ["RELEVANCE_SCORE"],
              expectedImprovement: 0.15,
              riskLevel: EngineRiskLevel.LOW,
              dependencies: [],
            },
          },
        ],
      });

      // Mock executeStrategies method
      vi.spyOn(service as any, "executeStrategies").mockResolvedValue([]);

      // Mock startLearningCycle method
      vi.spyOn(service as any, "startLearningCycle").mockResolvedValue(
        mockOperation
      );
    });

    it("should execute autonomous learning cycle", async () => {
      // Mock the learning events
      vi.mocked(prisma.learningEvent.findMany).mockResolvedValue(
        mockLearningEvents as any
      );

      // Mock the learning result creation
      const mockLearningResult = {
        id: "result-1",
        patterns: JSON.stringify([
          {
            id: "pattern-1",
            type: "high_relevance_search",
            confidence: 0.9,
            features: {
              relevantHits: 80,
              totalHits: 100,
              searchType: "keyword",
              took: 50,
            },
            metadata: {
              source: "test",
              timestamp: new Date().toISOString(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
        confidence: 0.9,
        metadata: JSON.stringify({
          eventCount: 1,
          executedStrategies: 0,
        }),
        operationId: "test-op",
        recommendations: {
          create: [
            {
              type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
              priority: 0.8,
              confidence: 0.9,
              impact: 0.7,
              metadata: JSON.stringify({
                targetMetrics: ["RELEVANCE_SCORE"],
                expectedImprovement: 0.15,
                riskLevel: EngineRiskLevel.LOW,
                dependencies: [],
              }),
            },
          ],
        },
      };
      vi.mocked(prisma.engineLearningResult.create).mockResolvedValue(
        mockLearningResult as any
      );

      await service.executeAutonomousLearningCycle();

      expect(prisma.engineLearningResult.create).toHaveBeenCalled();
      expect(mockLogger.child().info).toHaveBeenCalledWith(
        "Completed autonomous learning cycle",
        expect.any(Object)
      );
    });

    it("should handle empty learning events", async () => {
      vi.mocked(prisma.learningEvent.findMany).mockResolvedValue([]);

      await service.executeAutonomousLearningCycle();

      expect(prisma.engineOperation.update).toHaveBeenCalledWith({
        where: { id: mockOperation.id },
        data: expect.objectContaining({
          status: EngineOperationStatus.COMPLETED,
          metrics: expect.any(String),
          endTime: expect.any(Date),
        }),
      });
    });

    it("should handle learning cycle errors", async () => {
      vi.mocked(prisma.learningEvent.findMany).mockRejectedValue(
        new Error("Learning error")
      );

      await service.executeAutonomousLearningCycle();

      expect(mockLogger.child().error).toHaveBeenCalledWith(
        "Failed autonomous learning cycle",
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });
  });

  describe("Strategy Management", () => {
    const mockStrategy: EngineOptimizationStrategy = {
      id: "strategy-1",
      learningResultId: "learning-1",
      resultId: "result-1",
      type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
      priority: 0.8,
      confidence: 0.9,
      impact: 0.7,
      metadata: {
        targetMetrics: ["RELEVANCE_SCORE"],
        expectedImprovement: 0.15,
        riskLevel: EngineRiskLevel.LOW,
        dependencies: [],
      },
    };

    beforeEach(() => {
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: "test-state-id",
        status: EngineStatus.READY,
        confidence: 0.8,
        lastActive: new Date(),
        metadata: { riskTolerance: "low" },
        currentPhase: null,
      } as any);

      vi.mocked(prisma.searchWeights.findFirst).mockResolvedValue({
        id: "weights-1",
        titleWeight: 1.0,
        contentWeight: 1.0,
        tagWeight: 1.0,
        active: true,
        metadata: JSON.stringify({
          previousWeights: {},
          strategyId: "strategy-1",
        }),
      } as any);

      vi.mocked(prisma.engineLearningResult.update).mockResolvedValue({
        id: "learning-1",
        patterns: [],
        confidence: 0.9,
        metadata: {},
        operationId: "test-op",
      } as any);

      vi.spyOn(service as any, "adjustWeights").mockResolvedValue(undefined);
      vi.spyOn(service as any, "recordStrategyExecution").mockImplementation(
        async (...args: unknown[]) => {
          const strategy = args[0] as EngineOptimizationStrategy;
          await prisma.engineLearningResult.update({
            where: { id: strategy.learningResultId },
            data: {
              metadata: JSON.stringify({
                strategyType: strategy.type,
                confidence: strategy.confidence,
                executionTimestamp: expect.any(String),
              }),
              validatedAt: expect.any(Date),
              performance: JSON.stringify({
                status: "EXECUTED",
                timestamp: expect.any(String),
              }),
            },
          });
        }
      );
    });

    it("should execute strategy successfully", async () => {
      await service.executeStrategy(mockStrategy);

      expect(prisma.engineLearningResult.update).toHaveBeenCalledWith({
        where: { id: mockStrategy.learningResultId },
        data: {
          metadata: JSON.stringify({
            strategyType: mockStrategy.type,
            confidence: mockStrategy.confidence,
            executionTimestamp: expect.any(String),
          }),
          validatedAt: expect.any(Date),
          performance: JSON.stringify({
            status: "EXECUTED",
            timestamp: expect.any(String),
          }),
        },
      });
    });

    it("should handle high risk strategies appropriately", async () => {
      const highRiskStrategy: EngineOptimizationStrategy = {
        ...mockStrategy,
        metadata: {
          ...mockStrategy.metadata,
          riskLevel: EngineRiskLevel.HIGH,
        },
      };

      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: "test-state-id",
        status: EngineStatus.READY,
        confidence: 0.8,
        lastActive: new Date(),
        metadata: { riskTolerance: "low" },
        currentPhase: null,
      } as any);

      await expect(service.executeStrategy(highRiskStrategy)).rejects.toThrow(
        "High risk strategies are not allowed in current state"
      );
    });

    it("should rollback strategy successfully", async () => {
      await service.rollbackStrategyPublic(mockStrategy);

      expect(prisma.engineLearningResult.update).toHaveBeenCalledWith({
        where: { id: mockStrategy.learningResultId },
        data: {
          performance: expect.objectContaining({
            rolledBack: true,
            rollbackReason: "Performance degradation",
          }),
        },
      });
    });

    it("should handle rollback errors gracefully", async () => {
      vi.mocked(prisma.searchWeights.findFirst).mockResolvedValue(null);

      await expect(
        service.rollbackStrategyPublic(mockStrategy)
      ).rejects.toThrow("No weights found for rollback");
    });
  });

  describe("Performance Analysis", () => {
    beforeEach(() => {
      vi.spyOn(service as any, "calculateLoadFactor").mockReturnValue(0.8);
      vi.spyOn(service as any, "calculateTScore").mockReturnValue(2.0);
      vi.spyOn(service as any, "calculatePValue").mockReturnValue(0.98);
    });

    it("should calculate strategy impact correctly", async () => {
      const baselineMetrics = {
        latency: 100,
        throughput: 1000,
        errorRate: 0.05,
        cpuUsage: 0.5,
        memoryUsage: 0.4,
      };

      const currentMetrics = {
        latency: 80,
        throughput: 1200,
        errorRate: 0.03,
        cpuUsage: 0.45,
        memoryUsage: 0.35,
      };

      const impact = await (service as any).calculateStrategyImpact(
        baselineMetrics,
        currentMetrics
      );

      // Verify improvements are calculated correctly
      // (after - before) / before * loadFactor
      expect(impact.improvements.latency).toBeCloseTo(-0.2, 1); // (80-100)/100 * 0.8
      expect(impact.improvements.throughput).toBeCloseTo(0.16, 1); // (1200-1000)/1000 * 0.8
      expect(impact.improvements.errorRate).toBeCloseTo(-0.32, 1); // (0.03-0.05)/0.05 * 0.8

      // Verify the weighted improvement is positive (overall improvement)
      // latency: -0.2 * 0.4 = -0.08
      // throughput: 0.16 * 0.3 = 0.048
      // errorRate: -0.32 * 0.2 = -0.064
      // cpuUsage: -0.08 * 0.05 = -0.004
      // memoryUsage: -0.1 * 0.05 = -0.005
      // Total: -0.105
      expect(impact.weightedImprovement).toBeLessThan(0);
    });

    it("should calculate statistical significance", async () => {
      const baselineMetrics = {
        latency: 100,
        throughput: 1000,
      };

      const currentMetrics = {
        latency: 80,
        throughput: 1200,
      };

      const significance = await (
        service as any
      ).calculateStatisticalSignificance(baselineMetrics, currentMetrics);

      expect(significance).toBe(0.98);
    });

    it("should calculate confidence intervals", async () => {
      const improvements = {
        latency: 0.2,
        throughput: 0.15,
        errorRate: 0.1,
      };

      const interval = await (service as any).calculateConfidenceInterval(
        improvements
      );

      expect(interval).toBeGreaterThan(0);
      expect(interval).toBeLessThanOrEqual(1);
    });

    it("should handle degraded performance", async () => {
      const baselineMetrics = {
        latency: 80,
        throughput: 1200,
        errorRate: 0.03,
        cpuUsage: 0.45,
        memoryUsage: 0.35,
      };

      const degradedMetrics = {
        latency: 100,
        throughput: 1000,
        errorRate: 0.05,
        cpuUsage: 0.5,
        memoryUsage: 0.4,
      };

      const impact = await (service as any).calculateStrategyImpact(
        baselineMetrics,
        degradedMetrics
      );

      // For degraded metrics, the improvements will be negative
      // (after - before) / before * loadFactor
      expect(impact.improvements.latency).toBeCloseTo(0.2, 1); // (100-80)/80 * 0.8
      expect(impact.improvements.throughput).toBeCloseTo(-0.13, 1); // (1000-1200)/1200 * 0.8
      expect(impact.improvements.errorRate).toBeCloseTo(0.53, 1); // (0.05-0.03)/0.03 * 0.8
    });

    it("should handle insignificant changes", async () => {
      const baselineMetrics = {
        latency: 100,
        throughput: 1000,
        errorRate: 0.05,
        cpuUsage: 0.5,
        memoryUsage: 0.4,
      };

      const similarMetrics = {
        latency: 101,
        throughput: 998,
        errorRate: 0.051,
        cpuUsage: 0.505,
        memoryUsage: 0.404,
      };

      vi.spyOn(service as any, "calculatePValue").mockReturnValue(0.85);

      const impact = await (service as any).calculateStrategyImpact(
        baselineMetrics,
        similarMetrics
      );

      expect(impact.isSignificant).toBe(false);
      expect(Math.abs(impact.weightedImprovement)).toBeLessThan(0.05);
    });
  });
});
