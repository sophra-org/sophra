import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules before any other imports
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: vi.fn(() => ({
      engineState: {
        findFirst: vi.fn().mockResolvedValue({
          id: "state1",
          status: "READY",
          confidence: 0.9,
          lastActive: new Date(),
          metadata: "{}",
          currentPhase: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      },
      learningEvent: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    })),
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
    EngineStatus: {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      ERROR: 'ERROR'
    },
    LearningEventType: {
      SEARCH_PATTERN: 'SEARCH_PATTERN',
      FEEDBACK: 'FEEDBACK',
      PERFORMANCE: 'PERFORMANCE'
    },
    LearningEventStatus: {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      FAILED: 'FAILED'
    },
    LearningEventPriority: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH'
    }
  };
});

vi.mock("../../../lib/cortex/elasticsearch/services", () => ({
  ElasticsearchService: vi.fn().mockImplementation(() => ({
    search: vi.fn(),
    index: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }))
}));

vi.mock("../../../lib/cortex/monitoring/metrics", () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    getAverageLatency: vi.fn().mockResolvedValue(100),
    getThroughput: vi.fn().mockResolvedValue(1000),
    getErrorRate: vi.fn().mockResolvedValue(0.01),
    getCPUUsage: vi.fn().mockResolvedValue(0.5)
  }))
}));

vi.mock("ioredis", () => {
  const mockRedis = {
    xread: vi.fn(),
    xadd: vi.fn(),
    xdel: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  };
  return {
    Redis: vi.fn(() => mockRedis)
  };
});

vi.mock("../../../lib/shared/database/client", () => ({
  prisma: new (require("@prisma/client").PrismaClient)()
}));

// Now import everything else
import { LearningEvent, LearningEventPriority, LearningEventStatus, LearningEventType } from "@prisma/client";
import { Redis } from "ioredis";
import { ElasticsearchService } from "../../cortex/elasticsearch/services";
import { MetricsService } from "../../cortex/monitoring/metrics";
import { Logger } from "../../shared/types";
import { RealTimeLearner } from "./real-time-learner";

const mockEvent: LearningEvent = {
  id: "event1",
  type: LearningEventType.SEARCH_PATTERN,
  status: LearningEventStatus.COMPLETED,
  timestamp: new Date(),
  metadata: { relevantHits: 10, totalHits: 20 },
  retryCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  processedAt: null,
  error: null,
  correlationId: null,
  sessionId: null,
  userId: null,
  clientId: null,
  environment: null,
  version: null,
  priority: LearningEventPriority.MEDIUM,
  tags: [],
};

describe("RealTimeLearner", () => {
  let learner: RealTimeLearner;
  let mockRedis: Redis;
  let mockElasticsearch: ElasticsearchService;
  let mockMetrics: MetricsService;
  let mockLogger: Logger;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    const xreadMock = vi.fn();
    xreadMock.mockResolvedValue([
      ["stream", [["1234567890-0", ["event", JSON.stringify(mockEvent)]]]]
    ]);

    mockRedis = {
      xread: xreadMock,
      xadd: vi.fn(),
      xdel: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn()
    } as unknown as Redis;

    mockElasticsearch = new ElasticsearchService({} as any);
    mockMetrics = new MetricsService({} as any);
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    learner = new RealTimeLearner({
      redis: mockRedis,
      elasticsearch: mockElasticsearch,
      logger: mockLogger,
      metrics: mockMetrics,
      minConfidenceThreshold: 0.8,
      validationWindow: 10,
      batchSize: 1,
    });
  });

  afterEach(async () => {
    await learner.stop();
    vi.clearAllMocks();
  });

  describe("lifecycle", () => {
    it("should handle start and stop correctly", async () => {
      // Mock the stream consumer to resolve immediately
      vi.spyOn(learner as any, "initializeStreamConsumer").mockImplementation(async () => {
        while ((learner as any).isRunning) {
          await new Promise(resolve => resolve(null));
        }
      });

      // Start
      const startPromise = learner.start();
      expect(mockLogger.info).toHaveBeenCalledWith("Starting RealTimeLearner");

      // Try starting again
      await learner.start();
      expect(mockLogger.warn).toHaveBeenCalledWith("RealTimeLearner is already running");

      // Stop
      await learner.stop();
      await startPromise;
      expect(mockLogger.info).toHaveBeenCalledWith("RealTimeLearner stopping gracefully");

      // Try stopping again
      await learner.stop();
      expect(mockLogger.warn).toHaveBeenCalledWith("RealTimeLearner is not running");
    });
  });

  describe("event processing", () => {
    it("should process events and handle errors", async () => {
      // Mock the stream consumer to actually process one event
      vi.spyOn(learner as any, "initializeStreamConsumer").mockImplementation(async () => {
        if ((learner as any).isRunning) {
          try {
            const result = await mockRedis.xread("BLOCK", 0, "STREAMS", "nous:learning:stream", "$");
            if (result) {
              await (learner as any).processLearningBatch(result[0][1]);
            }
          } catch (error) {
            mockLogger.error("Stream consumer error", { error });
          }
        }
      });

      const successPromise = learner.start();
      expect(mockLogger.info).toHaveBeenCalled();
      await learner.stop();
      await successPromise;

      // Reset mocks
      vi.clearAllMocks();

      // Setup error case
      const xreadMock = vi.fn();
      xreadMock.mockRejectedValue(new Error("Processing failed"));
      (mockRedis as any).xread = xreadMock;

      const errorPromise = learner.start();
      await learner.stop();
      await errorPromise;
      expect(mockLogger.error).toHaveBeenCalledWith("Stream consumer error", { error: expect.any(Error) });
    });
  });

  describe("pattern analysis", () => {
    it("should validate strategies and calculate strength", async () => {
      const mockPattern = {
        id: "pattern1",
        eventId: "event1",
        type: "high_relevance_search",
        confidence: 0.9,
        features: {
          relevantHits: 100,
          totalHits: 120,
          took: 50,
        },
        metadata: {
          source: "test",
          detectedAt: new Date().toISOString(),
        },
        metrics: {
          latency: 80,
          throughput: 1200,
          errorRate: 0.005,
          resourceUtilization: 0.4,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test strategy validation
      const result = await learner["validateStrategies"]([mockPattern]);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].confidence).toBeGreaterThanOrEqual(0.8);

      // Test pattern strength calculation
      const strength = learner["calculatePatternStrength"](mockPattern);
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    });
  });
});
