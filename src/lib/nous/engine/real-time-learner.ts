import { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { prisma } from "@/lib/shared/database/client";
import { LearningEngine, ProcessorMap } from "@/lib/shared/engine";
import { MetricsAdapter } from "@/lib/shared/engine/adapters/metrics-adapter";
import {
  FeedbackProcessor,
  PerformanceProcessor,
  StrategyProcessor,
  TimeBasedProcessor,
} from "@/lib/shared/engine/processors";
import { ITimeBasedProcessor } from "@/lib/shared/engine/processors/time-based-processor";
import { Logger } from "@/lib/shared/types";
import {
  EngineOptimizationStrategy,
  EngineOptimizationType,
  EngineRiskLevel,
  LearningEvent,
  LearningEventPriority,
  LearningEventStatus,
  LearningEventType,
  LearningPattern,
} from "@prisma/client";
import { Redis } from "ioredis";

interface PerformanceMetrics {
  latency: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: number;
}

interface ImpactMetrics {
  latencyImprovement: number;
  throughputGain: number;
  errorRateReduction: number;
  resourceOptimization: number;
}

interface RealTimeLearnerConfig {
  redis: Redis;
  elasticsearch: ElasticsearchService;
  logger: Logger;
  metrics: MetricsService;
  minConfidenceThreshold: number;
  validationWindow: number; // ms
  batchSize: number;
}

interface LearningMetrics {
  latency?: number;
  throughput?: number;
  errorRate?: number;
  resourceUtilization?: number;
}

interface LearningFeatures {
  relevantHits?: number;
  totalHits?: number;
  took?: number;
}

interface ExtendedLearningPattern extends LearningPattern {
  metrics: LearningMetrics;
  features: {
    relevantHits?: number;
    totalHits?: number;
    took?: number;
  };
}

interface ValidationContext {
  strategyId: string;
  baselineMetrics: PerformanceMetrics;
  projectedImpact: ImpactMetrics;
  validationStartTime: number;
  sampledQueries: Set<string>;
}

interface MetricSample {
  timestamp: number;
  metrics: PerformanceMetrics;
}

export class RealTimeLearner {
  private validationQueue: Map<string, ValidationContext>;
  private learningStream: string = "nous:learning:stream";
  private engine: LearningEngine;
  private prisma: typeof prisma;
  private isRunning: boolean = false;

  constructor(private config: RealTimeLearnerConfig) {
    this.validationQueue = new Map();
    this.prisma = prisma;

    const metricsAdapter = new MetricsAdapter(config.metrics, config.logger);
    
    // Initialize processors with their required dependencies
    const timeBasedProcessor = Object.assign(
      new TimeBasedProcessor(),
      {
        findRecurringPatterns: async (params: any) => ({
          daily: [],
          weekly: [],
          confidence: 0
        })
      }
    ) as unknown as ITimeBasedProcessor;

    const processors: ProcessorMap = {
      feedback: new FeedbackProcessor(),
      performance: new PerformanceProcessor(),
      timeBased: timeBasedProcessor,
      strategy: new StrategyProcessor()
    };

    this.engine = new LearningEngine(config.logger, processors, this.prisma);
  }

  /**
   * Start the real-time learner.
   * This will begin consuming events from the Redis stream.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.config.logger.warn("RealTimeLearner is already running");
      return;
    }
    
    this.isRunning = true;
    this.config.logger.info("Starting RealTimeLearner");
    await this.initializeStreamConsumer();
  }

  /**
   * Stop the real-time learner.
   * This will gracefully stop consuming events.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.config.logger.warn("RealTimeLearner is not running");
      return;
    }
    
    this.isRunning = false;
    this.config.logger.info("RealTimeLearner stopping gracefully");
  }

  private deserializeLearningEvent(record: any): LearningEvent {
    const [id, fields] = record;
    return {
      id,
      type: fields.type as LearningEventType,
      timestamp: new Date(parseInt(fields.timestamp)),
      retryCount: fields.retryCount || 0,
      createdAt: new Date(parseInt(fields.createdAt)),
      updatedAt: new Date(parseInt(fields.updatedAt)),
      processedAt: fields.processedAt
        ? new Date(parseInt(fields.processedAt))
        : null,
      status: fields.status as LearningEventStatus,
      priority: fields.priority as LearningEventPriority,
      tags: JSON.parse(fields.tags || "[]"),
      metadata: JSON.parse(fields.metadata || "{}"),
      error: fields.error || null,
      correlationId: fields.correlationId || null,
      sessionId: fields.sessionId || null,
      userId: fields.userId || null,
      clientId: fields.clientId || null,
      environment: fields.environment || null,
      version: fields.version || null,
    };
  }

  private async collectBaselineMetrics(): Promise<PerformanceMetrics> {
    return {
      latency: await this.config.metrics.getAverageLatency(),
      throughput: await this.config.metrics.getThroughput(),
      errorRate: await this.config.metrics.getErrorRate(),
      resourceUtilization: await this.config.metrics.getCPUUsage(),
    };
  }

  private async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    return this.collectBaselineMetrics();
  }

  private calculateProjectedImpact(
    strategy: ExtendedLearningPattern,
    baseline: PerformanceMetrics
  ): ImpactMetrics {
    const patternStrength = this.calculatePatternStrength(strategy);
    const historicalSuccess = this.getHistoricalSuccessRate(strategy.type);

    const baseImprovement = {
      latencyImprovement: strategy.metrics?.latency
        ? (baseline.latency - strategy.metrics.latency) / baseline.latency
        : 0.1,
      throughputGain: strategy.metrics?.throughput
        ? (strategy.metrics.throughput - baseline.throughput) /
          baseline.throughput
        : 0.15,
      errorRateReduction: strategy.metrics?.errorRate
        ? (baseline.errorRate - strategy.metrics.errorRate) / baseline.errorRate
        : 0.05,
      resourceOptimization: strategy.metrics?.resourceUtilization
        ? (baseline.resourceUtilization -
            strategy.metrics.resourceUtilization) /
          baseline.resourceUtilization
        : 0.2,
    };

    const confidenceMultiplier = Math.min(
      patternStrength * historicalSuccess,
      1.0
    );

    return {
      latencyImprovement:
        baseImprovement.latencyImprovement * confidenceMultiplier,
      throughputGain: baseImprovement.throughputGain * confidenceMultiplier,
      errorRateReduction:
        baseImprovement.errorRateReduction * confidenceMultiplier,
      resourceOptimization:
        baseImprovement.resourceOptimization * confidenceMultiplier,
    };
  }

  private calculatePatternStrength(pattern: ExtendedLearningPattern): number {
    const features = pattern.features as {
      relevantHits?: number;
      totalHits?: number;
      took?: number;
    };

    const factors = [
      pattern.confidence || 0.5,
      features.relevantHits !== undefined
        ? Math.min(features.relevantHits / 1000, 1)
        : 0.5,
      features.totalHits !== undefined
        ? Math.min(features.totalHits / 10000, 1)
        : 0.5,
      features.took !== undefined ? Math.min(1000 / features.took, 1) : 0.5,
    ];

    return factors.reduce((acc, factor) => acc * factor, 1);
  }

  private getHistoricalSuccessRate(patternType: string): number {
    // Start with optimistic default
    const defaultRate = 0.7;

    const typeSuccessRates: Record<string, number> = {
      high_relevance_search: 0.85,
      performance_optimization: 0.75,
      cache_hit_pattern: 0.9,
      index_usage_pattern: 0.8,
    };

    return typeSuccessRates[patternType] || defaultRate;
  }

  private async computeValidationResult(
    context: ValidationContext
  ): Promise<{ isValid: boolean }> {
    const currentMetrics = await this.collectCurrentMetrics();
    const threshold = this.config.minConfidenceThreshold;

    return {
      isValid:
        currentMetrics.latency <=
        context.baselineMetrics.latency * (1 + threshold),
    };
  }

  private async analyzePerformanceSamples(
    samples: MetricSample[],
    strategy: ExtendedLearningPattern
  ): Promise<boolean> {
    const avgLatency =
      samples.reduce((sum, sample) => sum + sample.metrics.latency, 0) /
      samples.length;
    return avgLatency <= (strategy.metrics.latency || 0) * 1.1; // 10% threshold
  }

  private convertToOptimizationStrategy(
    pattern: ExtendedLearningPattern
  ): EngineOptimizationStrategy {
    return {
      id: pattern.id,
      type: pattern.type as EngineOptimizationType,
      confidence: pattern.confidence,
      metadata: {
        targetMetrics: ["latency", "throughput"],
        expectedImprovement: 0.1,
        riskLevel: "LOW",
        dependencies: [],
        searchPattern: pattern.id,
      },
      priority: 1,
      impact: 0.5,
      learningResultId: pattern.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async applyStrategiesWithValidation(
    strategies: ExtendedLearningPattern[]
  ) {
    for (const strategy of strategies) {
      try {
        const optimizationStrategy =
          this.convertToOptimizationStrategy(strategy);
        await this.engine.executeStrategy(optimizationStrategy);

        const monitoringResult =
          await this.monitorStrategyPerformance(strategy);
        if (!monitoringResult) {
          await this.engine.executeStrategy(optimizationStrategy);
          this.config.logger.warn("Strategy rolled back due to performance", {
            strategyId: strategy.id,
            metrics: monitoringResult,
          });
        }
      } catch (error) {
        this.config.logger.error("Strategy application failed", {
          error,
          strategyId: strategy.id,
        });
        await this.engine.executeStrategy(
          this.convertToOptimizationStrategy(strategy)
        );
      }
    }
  }

  private async monitorStrategyPerformance(strategy: ExtendedLearningPattern) {
    const monitoringWindow = 5 * 60 * 1000; // 5 minutes
    const samplingInterval = 30 * 1000; // 30 seconds
    const samples: MetricSample[] = [];

    const startTime = Date.now();
    while (Date.now() - startTime < monitoringWindow) {
      const metrics = await this.collectCurrentMetrics();
      samples.push({
        timestamp: Date.now(),
        metrics,
      });

      await new Promise((resolve) => setTimeout(resolve, samplingInterval));
    }

    return this.analyzePerformanceSamples(samples, strategy);
  }

  private async initializeStreamConsumer() {
    while (this.isRunning) {
      try {
        const result = await this.config.redis.xread(
          "BLOCK",
          0,
          "STREAMS",
          this.learningStream,
          "$"
        );
        const records = result?.[0]?.[1];

        if (records) {
          await this.processLearningBatch(records);
        }
      } catch (error) {
        this.config.logger.error("Stream consumer error", { error });
        if (this.isRunning) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  private async processLearningBatch(records: any[]) {
    const events = records.map((record) =>
      this.deserializeLearningEvent(record)
    );
    const { patterns } = await this.engine.detectPatterns(events);

    if (patterns.length === 0) return;

    // Convert patterns to extended patterns with metrics and features
    const extendedPatterns: ExtendedLearningPattern[] = patterns.map(
      (pattern) => ({
        ...pattern,
        metrics: {
          latency: undefined,
          throughput: undefined,
          errorRate: undefined,
          resourceUtilization: undefined,
        },
        features: {
          relevantHits: undefined,
          totalHits: undefined,
          took: undefined,
        },
      })
    );

    // Apply optimization strategies
    const optimizedPatterns = extendedPatterns.map((pattern) => ({
      ...pattern,
      metrics: {
        latency: undefined,
        throughput: undefined,
        errorRate: undefined,
        resourceUtilization: undefined,
      },
      features: {
        relevantHits: undefined,
        totalHits: undefined,
        took: undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        source: "real-time-learner",
        detectedAt: new Date().toISOString(),
        targetMetrics: ["latency", "throughput"],
        expectedImprovement: 0.1,
        riskLevel: EngineRiskLevel.LOW,
        dependencies: [],
        searchPattern: pattern.id,
      },
    }));

    const validatedStrategies =
      await this.validateStrategies(optimizedPatterns);

    if (validatedStrategies.length > 0) {
      await this.applyStrategiesWithValidation(validatedStrategies);
    }
  }

  private async validateStrategies(strategies: ExtendedLearningPattern[]) {
    return strategies.filter(
      (strategy) =>
        strategy.confidence >= this.config.minConfidenceThreshold &&
        this.validateStrategyImpact(strategy)
    );
  }

  private async validateStrategyImpact(
    strategy: ExtendedLearningPattern
  ): Promise<boolean> {
    const baselineMetrics = await this.collectBaselineMetrics();
    const projectedImpact = this.calculateProjectedImpact(
      strategy,
      baselineMetrics
    );

    // Create validation context
    const validationContext = {
      strategyId: strategy.id,
      baselineMetrics,
      projectedImpact,
      validationStartTime: Date.now(),
      sampledQueries: new Set<string>(),
    };

    this.validationQueue.set(strategy.id, validationContext);

    // Wait for validation window
    await new Promise((resolve) =>
      setTimeout(resolve, this.config.validationWindow)
    );

    const validationResult =
      await this.computeValidationResult(validationContext);
    this.validationQueue.delete(strategy.id);

    return validationResult.isValid;
  }
}
