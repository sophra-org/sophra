import { mockPrisma } from "~/vitest.setup";

// Mock Prisma before other imports
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  EngineOperationStatus: {
    COMPLETED: "COMPLETED",
    RUNNING: "RUNNING",
    FAILED: "FAILED",
  },
  EngineOperationType: {
    PATTERN_DETECTION: "PATTERN_DETECTION",
    STRATEGY_EXECUTION: "STRATEGY_EXECUTION",
    STRATEGY_ROLLBACK: "STRATEGY_ROLLBACK",
  },
}));

vi.mock("../database/client", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

import { EngineOperationStatus, LearningEvent, Prisma } from "@prisma/client";
import type { Mocked } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MetricsService } from "../../cortex/monitoring/metrics";
import { EnhancedPrismaClient } from "../database/client";
import type { Logger } from "../types";
import { MetricsAdapter } from "./adapters/metrics-adapter";
import { LearningEngine } from "./learning-engine";
import {
  FeedbackProcessor,
  PerformanceProcessor,
  StrategyProcessor,
} from "./processors";
import type { ITimeBasedProcessor } from "./processors/time-based-processor";

type JsonValue = Prisma.JsonValue;

describe("LearningEngine", () => {
  let engine: LearningEngine;
  let logger: Logger;
  let mockMetrics: Mocked<MetricsService>;
  let metricsAdapter: MetricsAdapter;
  let mockFeedbackProcessor: FeedbackProcessor;
  let mockPerformanceProcessor: PerformanceProcessor;
  let mockTimeBasedProcessor: ITimeBasedProcessor;
  let mockStrategyProcessor: StrategyProcessor;

  beforeEach(() => {
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    mockMetrics = {
      getAverageLatency: vi.fn(),
      getThroughput: vi.fn(),
      getErrorRate: vi.fn(),
      getCPUUsage: vi.fn(),
      getMemoryUsage: vi.fn(),
      recordEngineMetric: vi.fn(),
      recordLearningMetrics: vi.fn(),
    } as unknown as Mocked<MetricsService>;

    metricsAdapter = new MetricsAdapter(mockMetrics, logger);

    mockFeedbackProcessor = {
      analyze: vi.fn(),
      process: vi.fn(),
    } as unknown as FeedbackProcessor;

    mockPerformanceProcessor = {
      analyze: vi.fn(),
      process: vi.fn(),
    } as unknown as PerformanceProcessor;

    mockTimeBasedProcessor = {
      analyze: vi.fn(),
      process: vi.fn(),
      getTimeSeriesData: vi.fn(),
      analyzeCorrelations: vi.fn(),
      findRecurringPatterns: vi.fn(),
      logger,
      metrics: metricsAdapter,
      calculateConfidence: () => 0.8,
    } as unknown as ITimeBasedProcessor;

    mockStrategyProcessor = {
      executeStrategy: vi.fn(),
      process: vi.fn(),
    } as unknown as StrategyProcessor;

    engine = new LearningEngine(
      logger,
      {
        feedback: mockFeedbackProcessor,
        performance: mockPerformanceProcessor,
        timeBased: mockTimeBasedProcessor,
        strategy: mockStrategyProcessor,
      },
      mockPrisma as unknown as EnhancedPrismaClient
    );
  });

  afterEach(async () => {
    await mockPrisma.$disconnect();
  });

  describe("detectPatterns", () => {
    it("should create an operation and analyze patterns", async () => {
      const mockOperation = {
        id: "1",
        type: "PATTERN_DETECTION",
        status: "RUNNING",
        startTime: new Date(),
        endTime: undefined,
        error: null,
        metrics: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockOperationWithEndTime = {
        ...mockOperation,
        endTime: null,
      };
      vi.mocked(mockPrisma.engineOperation.create).mockResolvedValue(
        mockOperationWithEndTime
      );
      vi.mocked(mockPrisma.engineOperation.update).mockResolvedValue({
        id: mockOperation.id,
        type: mockOperation.type,
        status: EngineOperationStatus.COMPLETED,
        startTime: mockOperation.startTime,
        endTime: new Date(),
        error: null,
        metrics: {} as JsonValue,
        metadata: {} as JsonValue,
        createdAt: mockOperation.createdAt,
        updatedAt: mockOperation.updatedAt,
      });

      const events: LearningEvent[] = [];
      const mockPatterns = [
        {
          id: "pattern-1",
          type: "TEST_PATTERN",
          metadata: {} as JsonValue,
          createdAt: new Date(),
          updatedAt: new Date(),
          confidence: 0.9,
          features: {} as JsonValue,
          eventId: "event-1",
        },
        {
          id: "pattern-2",
          type: "TEST_PATTERN",
          metadata: {} as JsonValue,
          createdAt: new Date(),
          updatedAt: new Date(),
          confidence: 0.9,
          features: {} as JsonValue,
          eventId: "event-2",
        },
      ];

      vi.mocked(mockFeedbackProcessor.analyze).mockResolvedValue([
        mockPatterns[0],
      ]);
      vi.mocked(mockPerformanceProcessor.analyze).mockResolvedValue([]);
      vi.mocked(mockTimeBasedProcessor.analyze).mockResolvedValue([
        mockPatterns[1],
      ]);

      const result = await engine.detectPatterns(events);

      expect(result.operation.type).toBe("PATTERN_DETECTION");
      expect(result.operation.status).toBe(EngineOperationStatus.COMPLETED);
      expect(result.patterns).toEqual(mockPatterns);
    });
  });

  describe("getTimeSeriesData", () => {
    it("should delegate to timeBased processor", async () => {
      const params = {
        startDate: new Date(),
        endDate: new Date(),
        granularity: "daily",
      };
      const expectedData = {
        data: [
          {
            x: new Date(),
            y: 0,
          },
        ],
      };
      vi.mocked(mockTimeBasedProcessor.getTimeSeriesData).mockResolvedValue(
        expectedData
      );

      const result = await engine.getTimeSeriesData(params);

      expect(mockTimeBasedProcessor.getTimeSeriesData).toHaveBeenCalledWith(
        params
      );
      expect(result).toEqual(expectedData);
    });
  });

  describe("analyzeTemporalCorrelations", () => {
    it("should delegate to timeBased processor", async () => {
      const timeSeriesData = { data: [{ x: new Date(), y: 0 }] };
      const expectedCorrelations = {
        correlations: [
          {
            variable1: "var1",
            variable2: "var2",
            coefficient: 0.8,
          },
        ],
      };
      const expectedPatterns = {
        daily: [{ time: "09:00", confidence: 0.85 }],
        weekly: [{ day: "Monday", confidence: 0.85 }],
        confidence: 0.85,
      };

      vi.mocked(mockTimeBasedProcessor.analyzeCorrelations).mockResolvedValue(
        expectedCorrelations
      );
      vi.mocked(mockTimeBasedProcessor.findRecurringPatterns).mockResolvedValue(
        expectedPatterns
      );

      const result = await engine.analyzeTemporalCorrelations(timeSeriesData);

      expect(mockTimeBasedProcessor.analyzeCorrelations).toHaveBeenCalledWith(
        timeSeriesData
      );
      expect(result).toEqual(expectedCorrelations);
    });
  });

  describe("findRecurringPatterns", () => {
    it("should delegate to timeBased processor", async () => {
      const params = {
        timeframe: "weekly",
        minConfidence: 0.7,
      };
      const expectedPatterns = {
        daily: [],
        weekly: [],
        confidence: 0.8,
      };
      vi.mocked(mockTimeBasedProcessor.findRecurringPatterns).mockResolvedValue(
        expectedPatterns
      );

      const result = await engine.findRecurringPatterns(params);

      expect(mockTimeBasedProcessor.findRecurringPatterns).toHaveBeenCalledWith(
        params
      );
    });
  });
});
