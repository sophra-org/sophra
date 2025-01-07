import { mockPrisma } from '@/lib/shared/test/prisma.mock';
import { vi } from 'vitest';

// Mock Prisma before any other imports
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  EngineOperationType: {
    PATTERN_DETECTION: 'PATTERN_DETECTION',
    STRATEGY_EXECUTION: 'STRATEGY_EXECUTION',
    LEARNING: 'LEARNING'
  },
  EngineOperationStatus: {
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  EngineRiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  },
  MetricType: {
    REDIS_GET: 'REDIS_GET',
    REDIS_ERROR: 'REDIS_ERROR',
    SEARCH_LATENCY: 'SEARCH_LATENCY',
    SEARCH_THROUGHPUT: 'SEARCH_THROUGHPUT',
    SEARCH_ERROR: 'SEARCH_ERROR',
    SEARCH_RELEVANCE: 'SEARCH_RELEVANCE',
    SEARCH_COVERAGE: 'SEARCH_COVERAGE',
    SEARCH_DIVERSITY: 'SEARCH_DIVERSITY',
    SEARCH_FRESHNESS: 'SEARCH_FRESHNESS',
    SEARCH_QUALITY: 'SEARCH_QUALITY'
  }
}));

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma,
  prisma: mockPrisma
}));

// Regular imports after mocks
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineService } from "./service";
import type { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { EngineOperationType, EngineOperationStatus, EngineStatus, EngineOptimizationType, EngineRiskLevel, EngineState } from "./types";
import { LearningEventType, LearningEventStatus, LearningEventPriority } from "../types/learning";
import type { Logger } from '../../../lib/shared/types';

// Create a mock logger that satisfies the Winston Logger interface
const createMockLogger = () => {
  const logger = {
    // Core logging methods
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    verbose: vi.fn(),
    silly: vi.fn(),
    http: vi.fn(),
    
    // Winston logger properties
    service: "",
    silent: false,
    level: "info",
    levels: { error: 0, warn: 1, info: 2, debug: 3 },
    exitOnError: false,
    format: { transform: vi.fn() },
    transports: [],
    exceptions: {
      handle: vi.fn(),
      unhandle: vi.fn(),
      catcher: vi.fn(),
      getAllInfo: vi.fn(),
      getRequestData: vi.fn(),
      getProcessData: vi.fn(),
      getOsData: vi.fn(),
      getTrace: vi.fn(),
      logger: {} as any,
      handlers: []
    },
    rejections: {
      handle: vi.fn(),
      unhandle: vi.fn(),
      catcher: vi.fn(),
      getAllInfo: vi.fn(),
      getRequestData: vi.fn(),
      getProcessData: vi.fn(),
      getOsData: vi.fn(),
      getTrace: vi.fn(),
      logger: {} as any,
      handlers: []
    },
    profilers: {},

    // Event emitter methods
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
    setMaxListeners: vi.fn(),
    getMaxListeners: vi.fn(),
    listeners: vi.fn(),
    rawListeners: vi.fn(),
    listenerCount: vi.fn(),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
    eventNames: vi.fn(),
    
    // Additional Winston methods
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    profile: vi.fn(),
    startTimer: vi.fn(),
    child: vi.fn(),
    
    // Additional properties
    data: {},
    help: vi.fn(),
    close: vi.fn(),
    configure: vi.fn()
  };
  return logger;
}

// Define MetricsService type since we're mocking it
interface MetricsService {
  recordEngineMetric: (name: string, value: any) => Promise<void>;
  recordMetric: (name: string, value: any) => void;
  getAverageLatency: () => Promise<number>;
  getThroughput: () => Promise<number>;
  getErrorRate: () => Promise<number>;
  getCPUUsage: () => Promise<number>;
  getMemoryUsage: () => Promise<number>;
  getCurrentLoad: () => number;
  getBaselineLoad: () => number;
  logger: Logger;
  registry: Map<any, any>;
  errorCounter: number;
  operationLatency: number;
  metricsEnabled: boolean;
  samplingRate: number;
  batchSize: number;
  flushInterval: number;
  initialize: () => Promise<void>;
  shutdown: () => Promise<void>;
}

// Setup mock metrics service
const mockMetricsService: MetricsService = {
  recordEngineMetric: vi.fn(),
  recordMetric: vi.fn(),
  getAverageLatency: vi.fn().mockResolvedValue(100),
  getThroughput: vi.fn().mockResolvedValue(1000),
  getErrorRate: vi.fn().mockResolvedValue(0.01),
  getCPUUsage: vi.fn().mockResolvedValue(0.5),
  getMemoryUsage: vi.fn().mockResolvedValue(0.7),
  getCurrentLoad: vi.fn().mockReturnValue(0.5),
  getBaselineLoad: vi.fn().mockReturnValue(0.3),
  logger: {} as Logger,
  registry: new Map(),
  errorCounter: 0,
  operationLatency: 0,
  metricsEnabled: true,
  samplingRate: 1.0,
  batchSize: 100,
  flushInterval: 5000,
  initialize: vi.fn().mockResolvedValue(undefined),
  shutdown: vi.fn().mockResolvedValue(undefined)
};

// Mock state for EngineState type
const mockEngineState: EngineState = {
  id: "state1",
  status: EngineStatus.READY,
  confidence: 0.8,
  lastActive: new Date(),
  currentPhase: undefined,
  metadata: {}
};

// Mock state for Prisma type
const mockPrismaState = {
  id: "state1",
  status: String(EngineStatus.READY),
  confidence: 0.8,
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  currentPhase: null,
  metadata: "{}"
};

const mockOperation = {
  id: "op1",
  type: EngineOperationType.PATTERN_DETECTION,
  status: EngineOperationStatus.PENDING,
  startTime: new Date(),
  endTime: null,
  metadata: "{}",
  metrics: "{}",
  error: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockLearningEvent = {
  id: 'event1',
  type: LearningEventType.SEARCH_PATTERN,
  status: LearningEventStatus.COMPLETED,
  priority: LearningEventPriority.MEDIUM,
  timestamp: new Date(),
  processedAt: new Date(),
  metadata: {
    relevantHits: 10,
    totalHits: 100,
    searchType: 'keyword'
  },
  patterns: [],
  metrics: {},
  tags: [],
  error: undefined,
  retryCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  correlationId: "mock-correlation-id",
  sessionId: "mock-session-id",
  userId: "mock-user-id",
  clientId: "mock-client-id",
  environment: "test",
  version: "1.0.0"
};

const mockStrategy = {
  id: 'strategy1',
  type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
  confidence: 0.9,
  impact: 0.8,
  priority: 0.7,
  metadata: {
    targetMetrics: ['SEARCH_LATENCY'],
    expectedImprovement: 0.2,
    riskLevel: EngineRiskLevel.LOW,
    dependencies: []
  },
  resultId: 'result1',
  learningResultId: 'result1'
};

describe("EngineService", () => {
  let engineService: EngineService;
  let mockLogger: Logger;
  let mockRedisClient: Redis;
  let childLogger: Partial<Logger>;

  beforeEach(async () => {
    // Setup basic mocks
    // Setup child logger
    childLogger = createMockLogger() as unknown as Partial<Logger>;
    childLogger.service = "EngineService";

    // Setup mock logger
    mockLogger = createMockLogger() as unknown as Logger;
    mockLogger.service = "test";
    mockLogger.child = vi.fn().mockReturnValue(childLogger);

    // Cast loggers to satisfy type requirements
    mockLogger = mockLogger as unknown as Logger;
    childLogger = childLogger as unknown as Logger;

    mockRedisClient = {
      xadd: vi.fn().mockResolvedValue('ok'),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as Redis;

    // Create engine service with mocked dependencies
    engineService = new EngineService({
      redis: mockRedisClient,
      logger: mockLogger
    });

    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set up default mock implementations for Prisma
    mockPrisma.engineState.findFirst.mockResolvedValue(mockPrismaState);
    mockPrisma.engineState.create.mockResolvedValue(mockPrismaState);
    mockPrisma.engineState.update.mockResolvedValue(mockPrismaState);
    mockPrisma.engineOperation.create.mockResolvedValue(mockOperation);
    mockPrisma.engineOperation.update.mockResolvedValue(mockOperation);
    mockPrisma.engineLearningResult.create.mockResolvedValue({});
    mockPrisma.engineLearningResult.update.mockResolvedValue({});
    mockPrisma.learningEvent.findMany.mockResolvedValue([mockLearningEvent]);
    mockPrisma.searchWeights.findFirst.mockResolvedValue({
      id: 'test-weights',
      active: true,
      weights: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
    mockPrisma.searchWeights.create.mockResolvedValue({});
    mockPrisma.searchWeights.update.mockResolvedValue({});
    mockPrisma.searchConfig.upsert.mockResolvedValue({});
  });

  describe("initialization", () => {
    it("should initialize with default state", async () => {
      // Setup mock state
      const mockState = {
        ...mockPrismaState,
        status: String(EngineStatus.READY),
        confidence: 0.8
      };
      mockPrisma.engineState.findFirst.mockResolvedValueOnce(mockState);

      // Initialize engine
      await engineService.initialize();

      // Verify log message matches exactly what the service outputs
      expect(childLogger.info).toHaveBeenCalledWith("Engine service initialized", {
        status: mockState.status,
        confidence: mockState.confidence
      });
    });

    it("should create new state if none exists", async () => {
      mockPrisma.engineState.findFirst.mockResolvedValue(null);
      mockPrisma.engineState.create.mockResolvedValue({
        ...mockPrismaState,
        id: "new_state",
        status: String(EngineStatus.PAUSED)
      });

      await expect(engineService.initialize()).resolves.not.toThrow();
    });
  });

  describe("operations", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should handle operation errors", async () => {
      // Mock the operation to fail
      mockPrisma.engineOperation.create.mockRejectedValueOnce(new Error("Operation failed"));

      // Verify error handling
      await expect(engineService.startOperation(EngineOperationType.PATTERN_DETECTION))
        .rejects.toThrow("Operation failed");
    });

    it("should start operation", async () => {
      mockPrisma.engineState.findFirst.mockResolvedValue(mockPrismaState);
      mockPrisma.engineOperation.create.mockResolvedValue(mockOperation);
      mockPrisma.engineState.update.mockResolvedValue({
        ...mockPrismaState,
        status: String(EngineStatus.LEARNING)
      });

      // Initialize before test
      await engineService.initialize();

      const result = await engineService.startOperation(EngineOperationType.PATTERN_DETECTION);
      expect(result).toBeDefined();
      expect(result.type).toBe(EngineOperationType.PATTERN_DETECTION);
    });
  });

  describe("pattern analysis", () => {
    beforeEach(async () => {
      // Initialize engine before pattern analysis
      mockPrisma.engineState.findFirst.mockResolvedValueOnce(mockPrismaState);
      await engineService.initialize();
    });

    it("should analyze patterns from learning events", async () => {
      // Create a learning event with high relevance to ensure pattern generation
      const highRelevanceEvent = {
        ...mockLearningEvent,
        metadata: {
          relevantHits: 90,  // High relevance ratio (90/100 = 0.9)
          totalHits: 100,
          searchType: 'keyword',
          took: 50,  // Fast response time
          facetsUsed: true
        }
      };

      // Mock operation lifecycle
      const mockCreateOperation = {
        ...mockOperation,
        status: EngineOperationStatus.IN_PROGRESS,
        error: null,
        EngineLearningResult: null
      };

      const mockUpdateOperation = {
        ...mockOperation,
        status: EngineOperationStatus.COMPLETED,
        endTime: new Date(),
        error: null,
        EngineLearningResult: null
      };

      mockPrisma.engineOperation.create.mockResolvedValueOnce(mockCreateOperation);
      mockPrisma.engineOperation.update.mockResolvedValueOnce(mockUpdateOperation);

      // Execute pattern detection with high relevance event
      const { patterns, operation } = await engineService.detectPatterns([highRelevanceEvent]);

      // Verify results
      expect(operation).toBeDefined();
      expect(operation.status).toBe(EngineOperationStatus.COMPLETED);
      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe("strategy execution", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      
      // Initialize engine before strategy tests
      mockPrisma.engineState.findFirst.mockResolvedValue({
        ...mockPrismaState,
        metadata: "{}",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await engineService.initialize();
    });

    it("should execute strategy with low risk", async () => {
      const currentWeights = {
        id: 'weights1',
        titleWeight: 1.0,
        contentWeight: 0.8,
        tagWeight: 0.6,
        active: true,
        metadata: "{}",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const lowRiskStrategy = {
        ...mockStrategy,
        type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
        metadata: {
          ...mockStrategy.metadata,
          riskLevel: EngineRiskLevel.LOW,
          expectedImprovement: 0.2
        }
      };

      mockPrisma.searchWeights.findFirst.mockResolvedValue(currentWeights);
      mockPrisma.searchWeights.update.mockResolvedValue({
        ...currentWeights,
        active: false
      });

      // Execute strategy
      await engineService.executeStrategy(lowRiskStrategy);

      // Verify weight adjustments
      expect(mockPrisma.searchWeights.findFirst).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { createdAt: "desc" }
      });

      expect(mockPrisma.searchWeights.update).toHaveBeenCalledWith({
        where: { id: currentWeights.id },
        data: { active: false }
      });

      // Verify new weights creation with proper adjustments
      expect(mockPrisma.searchWeights.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          titleWeight: currentWeights.titleWeight * 1.2, // 20% improvement
          contentWeight: currentWeights.contentWeight,
          tagWeight: currentWeights.tagWeight * 1.1,
          active: true,
          metadata: expect.any(String)
        })
      });

      // Verify learning result update
      expect(mockPrisma.engineLearningResult.update).toHaveBeenCalledWith({
        where: { id: lowRiskStrategy.learningResultId },
        data: expect.objectContaining({
          metadata: expect.any(String),
          validatedAt: expect.any(Date),
          performance: expect.any(String)
        })
      });
    });

    it("should handle strategy execution errors", async () => {
      // Mock findFirst to return null to trigger the "No active weights found" error
      mockPrisma.searchWeights.findFirst.mockResolvedValueOnce(null);

      // Execute strategy and verify error
      await expect(engineService.executeStrategy(mockStrategy))
        .rejects.toThrow("No active weights found");

      // Verify that create was not called due to the error
      expect(mockPrisma.searchWeights.create).not.toHaveBeenCalled();
    });
  });
});
