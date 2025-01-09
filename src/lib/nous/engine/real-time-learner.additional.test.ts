import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import type { Logger } from "@/lib/shared/types";
import { EngineRiskLevel, LearningEventType } from "@prisma/client";
import { Redis } from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RealTimeLearner } from "./real-time-learner";

describe("RealTimeLearner Additional Tests", () => {
  let learner: RealTimeLearner;
  let mockRedis: Redis;
  let mockElasticsearch: ElasticsearchService;
  let mockMetrics: MetricsService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockRedis = {
      xread: vi.fn(),
      xadd: vi.fn(),
      xdel: vi.fn(),
    } as unknown as Redis;

    mockElasticsearch = {
      search: vi.fn(),
      index: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ElasticsearchService;

    mockMetrics = {
      getAverageLatency: vi.fn().mockResolvedValue(100),
      getThroughput: vi.fn().mockResolvedValue(1000),
      getErrorRate: vi.fn().mockResolvedValue(0.01),
      getCPUUsage: vi.fn().mockResolvedValue(0.5),
    } as unknown as MetricsService;

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

  describe("Impact Analysis", () => {
    it("should calculate projected impact accurately", async () => {
      const mockPattern = {
        id: "pattern1",
        type: "high_relevance_search",
        confidence: 0.9,
        metrics: {
          latency: 80,
          throughput: 1200,
          errorRate: 0.005,
          resourceUtilization: 0.4,
        },
        features: {
          relevantHits: 100,
          totalHits: 120,
          took: 50,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const baselineMetrics = {
        latency: 100,
        throughput: 1000,
        errorRate: 0.01,
        resourceUtilization: 0.5,
      };

      const impact = await (learner as any).calculateProjectedImpact(
        mockPattern,
        baselineMetrics
      );

      expect(impact.latencyImprovement).toBeGreaterThan(0);
      expect(impact.throughputGain).toBeGreaterThan(0);
      expect(impact.errorRateReduction).toBeGreaterThan(0);
      expect(impact.resourceOptimization).toBeGreaterThan(0);
    });

    it("should handle missing metrics gracefully", async () => {
      const mockPattern = {
        id: "pattern1",
        type: "high_relevance_search",
        confidence: 0.9,
        metrics: {},
        features: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const baselineMetrics = {
        latency: 100,
        throughput: 1000,
        errorRate: 0.01,
        resourceUtilization: 0.5,
      };

      const impact = await (learner as any).calculateProjectedImpact(
        mockPattern,
        baselineMetrics
      );

      expect(impact.latencyImprovement).toBeDefined();
      expect(impact.throughputGain).toBeDefined();
      expect(impact.errorRateReduction).toBeDefined();
      expect(impact.resourceOptimization).toBeDefined();
    });
  });

  describe("Performance Monitoring", () => {
    it("should analyze performance samples correctly", async () => {
      const samples = [
        {
          timestamp: Date.now(),
          metrics: {
            latency: 90,
            throughput: 1100,
            errorRate: 0.009,
            resourceUtilization: 0.45,
          },
        },
        {
          timestamp: Date.now() + 1000,
          metrics: {
            latency: 85,
            throughput: 1150,
            errorRate: 0.008,
            resourceUtilization: 0.43,
          },
        },
      ];

      const strategy = {
        id: "strategy1",
        metrics: {
          latency: 100,
        },
      };

      const result = await (learner as any).analyzePerformanceSamples(
        samples,
        strategy
      );
      expect(result).toBe(true);
    });

    it("should detect performance degradation", async () => {
      const samples = [
        {
          timestamp: Date.now(),
          metrics: {
            latency: 120,
            throughput: 900,
            errorRate: 0.015,
            resourceUtilization: 0.6,
          },
        },
      ];

      const strategy = {
        id: "strategy1",
        metrics: {
          latency: 100,
        },
      };

      const result = await (learner as any).analyzePerformanceSamples(
        samples,
        strategy
      );
      expect(result).toBe(false);
    });
  });

  describe("Strategy Validation", () => {
    it("should validate and apply strategies successfully", async () => {
      const mockStrategy = {
        id: "strategy1",
        type: "high_relevance_search",
        confidence: 0.95,
        metrics: {
          latency: 80,
          throughput: 1200,
        },
        features: {
          relevantHits: 100,
          totalHits: 120,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          riskLevel: EngineRiskLevel.LOW,
        },
      };

      // Mock successful validation
      vi.spyOn(learner as any, "validateStrategyImpact").mockResolvedValue(
        true
      );
      vi.spyOn(learner as any, "monitorStrategyPerformance").mockResolvedValue(
        true
      );

      await (learner as any).applyStrategiesWithValidation([mockStrategy]);

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it("should handle validation failures and rollback", async () => {
      const mockStrategy = {
        id: "strategy1",
        type: "high_relevance_search",
        confidence: 0.95,
        metrics: {
          latency: 80,
          throughput: 1200,
        },
        features: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock failed monitoring
      vi.spyOn(learner as any, "monitorStrategyPerformance").mockResolvedValue(
        false
      );

      await (learner as any).applyStrategiesWithValidation([mockStrategy]);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Strategy rolled back due to performance",
        expect.any(Object)
      );
    });
  });

  describe("Validation Queue Management", () => {
    it("should manage validation queue lifecycle", async () => {
      const mockStrategy = {
        id: "strategy1",
        type: LearningEventType.SEARCH_PATTERN,
        confidence: 0.9,
        metrics: {
          latency: 80,
          throughput: 1200,
          errorRate: 0.005,
          resourceUtilization: 0.4,
        },
        features: {
          relevantHits: 100,
          totalHits: 120,
          took: 50,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock validation methods
      vi.spyOn(learner as any, "collectBaselineMetrics").mockResolvedValue({
        latency: 100,
        throughput: 1000,
        errorRate: 0.01,
        resourceUtilization: 0.5,
      });

      vi.spyOn(learner as any, "collectCurrentMetrics").mockResolvedValue({
        latency: 80,
        throughput: 1200,
        errorRate: 0.005,
        resourceUtilization: 0.4,
      });

      // Start validation
      const validationPromise = (learner as any).validateStrategyImpact(
        mockStrategy
      );

      // Give time for the validation to be added to the queue
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check queue state
      expect((learner as any).validationQueue.has(mockStrategy.id)).toBe(true);

      // Wait for validation to complete
      await validationPromise;

      // Queue should be cleared
      expect((learner as any).validationQueue.has(mockStrategy.id)).toBe(false);
    });

    it("should handle concurrent validations", async () => {
      const strategies = [
        {
          id: "strategy1",
          type: LearningEventType.SEARCH_PATTERN,
          confidence: 0.9,
          metrics: {
            latency: 80,
            throughput: 1200,
            errorRate: 0.005,
            resourceUtilization: 0.4,
          },
          features: {
            relevantHits: 100,
            totalHits: 120,
            took: 50,
          },
        },
        {
          id: "strategy2",
          type: LearningEventType.SEARCH_PATTERN,
          confidence: 0.9,
          metrics: {
            latency: 85,
            throughput: 1150,
            errorRate: 0.006,
            resourceUtilization: 0.45,
          },
          features: {
            relevantHits: 95,
            totalHits: 115,
            took: 55,
          },
        },
      ];

      // Mock validation methods
      vi.spyOn(learner as any, "collectBaselineMetrics").mockResolvedValue({
        latency: 100,
        throughput: 1000,
        errorRate: 0.01,
        resourceUtilization: 0.5,
      });

      vi.spyOn(learner as any, "collectCurrentMetrics").mockResolvedValue({
        latency: 80,
        throughput: 1200,
        errorRate: 0.005,
        resourceUtilization: 0.4,
      });

      // Reduce validation window for testing
      (learner as any).config.validationWindow = 10;

      // Start concurrent validations
      const validationPromises = strategies.map((strategy) =>
        (learner as any).validateStrategyImpact(strategy)
      );

      // Give time for validations to be added to the queue
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check queue state
      expect((learner as any).validationQueue.size).toBe(2);

      // Wait for all validations
      await Promise.all(validationPromises);

      // Queue should be empty
      expect((learner as any).validationQueue.size).toBe(0);
    });
  });
});
