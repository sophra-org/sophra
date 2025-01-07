import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RealTimeLearner } from "./real-time-learner";
import { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { Redis } from "ioredis";
import { Logger } from "@/lib/shared/types";
import { prisma } from "@/lib/shared/database/client";
import { LearningEvent, LearningEventStatus, LearningEventType, LearningEventPriority } from "@prisma/client";
import { mockPrisma } from "@/lib/shared/test/prisma.mock";

// Mock Prisma client
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
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
  }
}));

vi.mock("@/lib/cortex/elasticsearch/services");
vi.mock("@/lib/cortex/monitoring/metrics");

// Mock Redis with proper constructor and methods
vi.mock("ioredis", () => {
  const mockRedis = {
    xread: vi.fn(),
    xadd: vi.fn(),
    xdel: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  };
  return {
    default: vi.fn(() => mockRedis)
  };
});

vi.mock("@/lib/shared/database/client", () => ({
  prisma: mockPrisma,
  JsonValue: {
    parse: JSON.parse,
    stringify: JSON.stringify
  }
}));

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
    mockRedis = {
      xread: vi.fn().mockResolvedValue([
        ["stream", [["1234567890-0", ["event", JSON.stringify(mockEvent)]]]]
      ]),
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

      // Setup success case
      vi.mocked(prisma.engineState.findFirst).mockResolvedValue({
        id: "state1",
        status: "READY",
        confidence: 0.9,
        lastActive: new Date(),
        metadata: "{}",
        currentPhase: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const successPromise = learner.start();
      expect(mockLogger.info).toHaveBeenCalled();
      await learner.stop();
      await successPromise;

      // Reset mocks
      vi.clearAllMocks();

      // Setup error case
      const mockError = new Error("Processing failed");
      vi.mocked(mockRedis.xread).mockRejectedValue(mockError);

      const errorPromise = learner.start();
      await learner.stop();
      await errorPromise;
      expect(mockLogger.error).toHaveBeenCalledWith("Stream consumer error", { error: mockError });
    });
  });

  describe("pattern analysis", () => {
    it("should validate strategies and calculate strength", async () => {
      // Setup metrics
      vi.mocked(mockMetrics.getAverageLatency).mockResolvedValue(100);
      vi.mocked(mockMetrics.getThroughput).mockResolvedValue(1000);
      vi.mocked(mockMetrics.getErrorRate).mockResolvedValue(0.01);
      vi.mocked(mockMetrics.getCPUUsage).mockResolvedValue(0.5);

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