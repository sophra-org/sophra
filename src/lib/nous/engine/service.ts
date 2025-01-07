import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { JsonValue, prisma } from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { Logger } from "@/lib/shared/types";
import {
  $Enums,
  EngineOperation,
  LearningEventStatus,
  MetricType,
} from "@prisma/client";
import Redis from "ioredis";
import { MetricsServiceConfig } from "../monitoring/metrics";
import {
  LearningEvent,
  LearningEventType,
  LearningPattern,
} from "../types/learning";
import {
  ABTestResults,
  EngineOperationStatus,
  EngineOperationType,
  EngineOptimizationStrategy,
  EngineOptimizationType,
  EngineRiskLevel,
  EngineState,
  EngineStatus,
  ImpactAnalysis,
  TestMetrics,
  VariantAnalysis,
} from "./types";

export class EnhancedMetricsService extends MetricsService {
  private cachedThroughput: number = 0;

  constructor(config: Logger) {
    super({ logger: config, environment: 'production' });
    this.updateCachedMetrics();
  }

  private async updateCachedMetrics(): Promise<void> {
    try {
      this.cachedThroughput = await this.getThroughput();
    } catch (error) {
      logger.error("Failed to update cached metrics", { error });
    }
    // Update every minute
    setTimeout(() => this.updateCachedMetrics(), 60000);
  }

  getCurrentLoad(): number {
    return this.cachedThroughput;
  }

  getBaselineLoad(): number {
    return this.cachedThroughput;
  }

  async getMetricVariability(): Promise<number> {
    try {
      const latency = await this.getAverageLatency();
      if (!latency) return 0.1; // default variability

      // Calculate variability using standard deviation / mean
      const variance = 0.1; // This should be calculated from historical data
      return Math.sqrt(variance) / latency; // coefficient of variation
    } catch (error) {
      return 0.1; // fallback to default
    }
  }

  async getAverageTrafficVolume(): Promise<number> {
    try {
      const metrics = await prisma.engineMetric.findMany({
        where: {
          type: MetricType.THROUGHPUT,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: {
          value: true,
        },
      });

      if (!metrics.length) {
        return this.getThroughput(); // Use base class method
      }

      const totalTraffic = metrics.reduce(
        (sum: number, metric: { value: number }) => sum + Number(metric.value),
        0
      );
      return Math.round(totalTraffic / metrics.length);
    } catch (error) {
      return this.getThroughput(); // Fallback to current throughput on error
    }
  }

  async getMetricsForVariant(
    _variant: string,
    startTime: number
  ): Promise<TestMetrics> {
    return {
      latency: await this.getAverageLatency(),
      errorRate: await this.getErrorRate(),
      throughput: await this.getThroughput(),
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
    };
  }
}

export class EngineService {
  private readonly logger: Logger;
  private readonly metrics: MetricsService;
  private currentState: EngineState | null = null;

constructor(
    private readonly config: {
      redis: Redis;
      logger: Logger;
    }
  ) {
    this.logger = config.logger.child({ service: "EngineService" });

    this.metrics = new MetricsService({ 
      logger: this.logger,
      environment: 'production'
    });
  }

  async initialize(): Promise<void> {
    try {
      this.currentState = await this.getOrCreateEngineState();
      this.logger.info("Engine service initialized", {
        status: EngineStatus.READY,
        confidence: 0.8,
      });
    } catch (error) {
      this.logger.error("Failed to initialize engine service", { error });
      throw error;
    }
  }

  private async getOrCreateEngineState(): Promise<EngineState> {
    const existingState = await prisma.engineState.findFirst({
      orderBy: { lastActive: "desc" },
    });

    if (existingState) {
      return {
        id: existingState.id,
        status: existingState.status as EngineStatus,
        currentPhase: existingState.currentPhase || undefined,
        confidence: existingState.confidence,
        lastActive: existingState.lastActive,
        metadata: existingState.metadata as Record<string, unknown> | undefined,
      };
    }

    const newState = await prisma.engineState.create({
      data: {
        status: EngineStatus.READY,
        confidence: 0.8,
        metadata: {
          initializationTime: new Date().toISOString(),
        },
      },
    });

    return {
      id: newState.id,
      status: newState.status as EngineStatus,
      confidence: newState.confidence,
      lastActive: newState.lastActive,
      metadata: newState.metadata as Record<string, unknown> | undefined,
    };
  }

  async startOperation(type: EngineOperationType): Promise<EngineOperation> {
    try {
      const operation = await prisma.engineOperation.create({
        data: {
          type,
          status: EngineOperationStatus.PENDING,
          metadata: {
            startedBy: "system",
            engineState: this.currentState?.status,
          },
        },
      });

      await this.updateEngineState({
        status: EngineStatus.LEARNING,
        currentPhase: type,
      });

      this.logger.info("Started engine operation", {
        type,
        operationId: operation.id,
      });

      return {
        id: operation.id,
        type: operation.type as EngineOperationType,
        status: operation.status as EngineOperationStatus,
        startTime: operation.startTime,
        error: null,
        createdAt: operation.createdAt,
        updatedAt: operation.updatedAt,
        endTime: null,
        metrics: {},
        metadata: operation.metadata as JsonValue,
      };
    } catch (error) {
      this.logger.error("Failed to start operation", { 
        error: error instanceof Error ? error.message : 'Unknown error',
        type 
      });
      throw error;
    }
  }

  private async updateEngineState(update: Partial<EngineState>): Promise<void> {
    if (!this.currentState?.id) {
      throw new Error("Engine not initialized");
    }

    try {
      const updatedState = await prisma.engineState.update({
        where: { id: this.currentState.id },
        data: {
          ...update,
          lastActive: new Date(),
          metadata: update.metadata
            ? JSON.stringify(update.metadata)
            : undefined,
        },
      });

      this.currentState = {
        id: updatedState.id,
        status: updatedState.status as EngineStatus,
        currentPhase: updatedState.currentPhase || undefined,
        confidence: updatedState.confidence,
        lastActive: updatedState.lastActive,
        metadata: updatedState.metadata as Record<string, unknown> | undefined,
      };

      await this.metrics.recordEngineMetric({
        type: MetricType.MODEL_ACCURACY,
        value: this.currentState.confidence,
        confidence: 1.0,
        metadata: { stateUpdate: update },
      });
    } catch (error) {
      this.logger.error("Failed to update engine state", { 
        error: error instanceof Error ? error.message : 'Unknown error',
        update 
      });
      throw error;
    }
  }

  async startLearningCycle(): Promise<EngineOperation> {
    try {
      const operation = await this.startOperation(EngineOperationType.LEARNING);

      await prisma.engineOperation.update({
        where: { id: operation.id },
        data: {
          status: EngineOperationStatus.IN_PROGRESS,
          metadata: JSON.stringify({
            startedAt: new Date().toISOString(),
            initialConfidence: this.currentState?.confidence,
          }),
        },
      });

      this.logger.info("Started learning cycle", {
        operationId: operation.id,
        currentConfidence: this.currentState?.confidence,
      });

      return operation;
    } catch (error) {
      this.logger.error("Failed to start learning cycle", { error });
      throw error;
    }
  }

  async completeOperation(
    operationId: string,
    data: {
      status: EngineOperationStatus;
      metrics?: Record<string, number>;
      error?: string;
    }
  ): Promise<void> {
    try {
      await prisma.engineOperation.update({
        where: { id: operationId },
        data: {
          status: data.status,
          endTime: new Date(),
          metrics: data.metrics ? JSON.stringify(data.metrics) : undefined,
          error: data.error,
        },
      });

      if (data.status === EngineOperationStatus.COMPLETED) {
        await this.updateEngineState({
          status: EngineStatus.READY,
          currentPhase: undefined,
          confidence:
            data.metrics?.confidence || this.currentState?.confidence || 0,
        });
      }

      this.logger.info("Completed operation", {
        operationId,
        status: data.status,
        metrics: data.metrics,
      });
    } catch (error) {
      this.logger.error("Failed to complete operation", { error, operationId });
      throw error;
    }
  }

  async detectPatterns(events: LearningEvent[]): Promise<{
    operation: EngineOperation;
    patterns: LearningPattern[];
  }> {
    try {
      const operation = await this.startOperation(
        EngineOperationType.PATTERN_DETECTION
      );
      const patterns: LearningPattern[] = [];
      let confidence = 0;

      for (const event of events) {
        if (event.type === LearningEventType.SEARCH_PATTERN) {
          const detectedPatterns = await this.analyzeSearchPatterns(event);
          patterns.push(...detectedPatterns);

          // Update confidence based on pattern quality
          confidence = Math.max(
            confidence,
            detectedPatterns.reduce((acc, p) => Math.max(acc, p.confidence), 0)
          );
        }
      }

      await this.completeOperation(operation.id, {
        status: EngineOperationStatus.COMPLETED,
        metrics: {
          patternCount: patterns.length,
          confidence,
          processingTimeMs: Date.now() - operation.startTime.getTime(),
        },
      });

      operation.status = EngineOperationStatus.COMPLETED;

      return { operation, patterns };
    } catch (error) {
      this.logger.error("Failed to detect patterns", { error });
      throw error;
    }
  }

  private async analyzeSearchPatterns(
    event: LearningEvent
  ): Promise<LearningPattern[]> {
    try {
      const patterns: LearningPattern[] = [];
      const metadata = event.metadata;

      if (metadata.relevantHits && metadata.totalHits) {
        const relevanceRatio = metadata.relevantHits / metadata.totalHits;

        if (relevanceRatio > 0.8) {
          patterns.push({
            id: `pattern_${event.id}`,
            type: "high_relevance_search",
            confidence: relevanceRatio,
            features: {
              relevantHits: metadata.relevantHits,
              totalHits: metadata.totalHits,
              searchType: metadata.searchType,
              facetsUsed: metadata.facetsUsed
                ? String(metadata.facetsUsed).split(",")
                : undefined,
            },
            metadata: {
              source: event.id,
              detectedAt: new Date().toISOString(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            metrics: {},
          });
        }
      }

      await this.metrics.recordEngineMetric({
        type: MetricType.MODEL_ACCURACY,
        value: patterns.length ? patterns[0].confidence : 0,
        confidence: 1.0,
        metadata: { eventId: event.id },
      });

      return patterns;
    } catch (error) {
      this.logger.error("Failed to analyze search patterns", {
        error,
        eventId: event.id,
      });
      throw error;
    }
  }

  async optimizeFromPatterns(patterns: LearningPattern[]): Promise<{
    operation: EngineOperation;
    strategies: EngineOptimizationStrategy[];
  }> {
    try {
      const operation = await this.startOperation(
        EngineOperationType.OPTIMIZATION
      );
      const strategies: EngineOptimizationStrategy[] = [];
      let totalConfidence = 0;

      for (const pattern of patterns) {
        const optimizations =
          await this.generateOptimizationStrategies(pattern);
        strategies.push(...optimizations);
        totalConfidence += pattern.confidence;
      }

      const averageConfidence = totalConfidence / patterns.length;

      await this.completeOperation(operation.id, {
        status: EngineOperationStatus.COMPLETED,
        metrics: {
          strategyCount: strategies.length,
          confidence: averageConfidence,
          processingTimeMs: Date.now() - operation.startTime.getTime(),
        },
      });

      return { operation, strategies };
    } catch (error) {
      this.logger.error("Failed to optimize from patterns", { error });
      throw error;
    }
  }

  private async generateOptimizationStrategies(
    pattern: LearningPattern
  ): Promise<EngineOptimizationStrategy[]> {
    try {
      const strategies: EngineOptimizationStrategy[] = [];

      if (pattern.type === "high_relevance_search") {
        // Weight adjustment strategy
        strategies.push({
          id: `opt_${pattern.id}_weights`,
          type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
          priority: pattern.confidence,
          confidence: pattern.confidence,
          impact: 0.8,
          metadata: {
            targetMetrics: ["RELEVANCE_SCORE", "SEARCH_LATENCY"],
            expectedImprovement: 0.15,
            riskLevel: EngineRiskLevel.LOW,
            dependencies: [],
          },
          resultId: "",
          learningResultId: "",
        });
        // Query transformation for high-performance patterns
        if (
          pattern.features?.took &&
          typeof pattern.features.took === "number" &&
          pattern.features.took < 100
        ) {
          strategies.push({
            id: `opt_${pattern.id}_query`,
            type: EngineOptimizationType.QUERY_TRANSFORMATION,
            priority: pattern.confidence * 0.95,
            confidence: pattern.confidence,
            impact: 0.7,
            metadata: {
              targetMetrics: ["SEARCH_LATENCY", "RELEVANCE_SCORE"],
              expectedImprovement: 0.2,
              riskLevel: EngineRiskLevel.LOW,
              dependencies: [],
              searchPattern: pattern.features.searchType as string,
            },
            resultId: "",
            learningResultId: "",
          });
        }
        // Index optimization for slow queries
        if (
          pattern.features?.took &&
          typeof pattern.features.took === "number" &&
          pattern.features.took > 500
        ) {
          strategies.push({
            id: `opt_${pattern.id}_index`,
            type: EngineOptimizationType.INDEX_OPTIMIZATION,
            priority: pattern.confidence * 0.85,
            confidence: pattern.confidence * 0.9,
            impact: 0.9,
            metadata: {
              targetMetrics: ["SEARCH_LATENCY"],
              expectedImprovement: 0.4,
              riskLevel: EngineRiskLevel.MEDIUM,
              dependencies: [],
              searchPattern: pattern.features.searchType as string,
            },
            resultId: "",
            learningResultId: "",
          });
        }
        // Cache strategy for high-traffic patterns
        if (
          pattern.features?.totalHits &&
          Number(pattern.features.totalHits) > 1000
        ) {
          strategies.push({
            id: `opt_${pattern.id}_cache`,
            type: EngineOptimizationType.CACHE_STRATEGY,
            priority: pattern.confidence * 0.9,
            confidence: pattern.confidence,
            impact: 0.6,
            metadata: {
              targetMetrics: ["SEARCH_LATENCY"],
              expectedImprovement: 0.3,
              riskLevel: EngineRiskLevel.LOW,
              dependencies: [],
              searchPattern: pattern.features.searchType as string,
            },
            resultId: "",
            learningResultId: "",
          });
        }
      }

      await this.metrics.recordEngineMetric({
        type: MetricType.MODEL_ACCURACY,
        value:
          strategies.reduce((acc, s) => acc + s.confidence, 0) /
          strategies.length,
        confidence: pattern.confidence,
        metadata: {
          patternId: pattern.id,
          strategiesGenerated: strategies.length,
        },
      });

      return strategies;
    } catch (error) {
      this.logger.error("Failed to generate optimization strategies", {
        error,
        patternId: pattern.id,
      });
      throw error;
    }
  }

  async executeAutonomousLearningCycle(): Promise<void> {
    try {
      // 1. Start learning cycle
      const operation = await this.startLearningCycle();

      // 2. Fetch recent learning events
      const recentEvents = await prisma.learningEvent.findMany({
        where: {
          status: LearningEventStatus.COMPLETED,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      const { patterns } = await this.detectPatterns(
        recentEvents.map(
          (event) =>
            ({
              id: event.id,
              type: event.type,
              status: event.status,
              error: event.error,
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
              metadata: event.metadata,
              patterns: [],
              retryCount: event.retryCount,
              priority: 1,
              timestamp: event.createdAt,
              tags: [],
            }) as unknown as LearningEvent
        )
      );

      if (patterns.length === 0) {
        await this.completeOperation(operation.id, {
          status: EngineOperationStatus.COMPLETED,
          metrics: {
            patternCount: 0,
            confidence: this.currentState?.confidence || 0,
          },
        });
        return;
      }

      // 4. Generate optimization strategies
      const { strategies } = await this.optimizeFromPatterns(patterns);

      // 5. Execute highest impact strategies autonomously
      const executedStrategies = await this.executeStrategies(
        strategies.filter(
          (s) =>
            s.confidence > 0.8 && // High confidence
            s.impact > 0.5 && // High impact
            s.metadata.riskLevel === EngineRiskLevel.LOW // Low risk
        )
      );

      // 6. Record learning results
      await prisma.engineLearningResult.create({
        data: {
          patterns: JSON.stringify(patterns),
          confidence: Math.max(...patterns.map((p) => p.confidence)),
          metadata: JSON.stringify({
            eventCount: recentEvents.length,
            executedStrategies: executedStrategies.length,
          }),
          operationId: operation.id,
          recommendations: {
            create: strategies.map((s) => ({
              type: s.type as unknown as $Enums.EngineOptimizationType,
              priority: s.priority,
              confidence: s.confidence,
              impact: s.impact,
              metadata: JSON.stringify(s.metadata),
            })),
          },
        },
      });

      // 7. Complete cycle
      await this.completeOperation(operation.id, {
        status: EngineOperationStatus.COMPLETED,
        metrics: {
          patternCount: patterns.length,
          strategiesGenerated: strategies.length,
          strategiesExecuted: executedStrategies.length,
          confidence: this.currentState?.confidence || 0,
        },
      });

      this.logger.info("Completed autonomous learning cycle", {
        patternsDetected: patterns.length,
        strategiesExecuted: executedStrategies.length,
      });
    } catch (error) {
      this.logger.error("Failed autonomous learning cycle", { error });
    }
  }
  
  private async executeStrategies(
    strategies: EngineOptimizationStrategy[]
  ): Promise<EngineOptimizationStrategy[]> {
    const executedStrategies: EngineOptimizationStrategy[] = [];

    for (const strategy of strategies) {
      try {
        switch (strategy.type) {
          case EngineOptimizationType.WEIGHT_ADJUSTMENT:
            await this.executeWeightAdjustment(strategy);
            break;
          case EngineOptimizationType.CACHE_OPTIMIZATION:
            await this.executeCacheStrategy(strategy);
            break;
          case EngineOptimizationType.QUERY_TRANSFORMATION:
            await this.executeQueryTransformation(strategy);
            break;
          case EngineOptimizationType.INDEX_OPTIMIZATION:
            await this.executeIndexOptimization(strategy);
            break;
          case EngineOptimizationType.CACHE_OPTIMIZATION:
            await this.executeCacheStrategy(strategy);
            break;
          // Add other strategy types as needed
        }
        executedStrategies.push(strategy);

        await this.metrics.recordEngineMetric({
          type: MetricType.MODEL_ACCURACY,
          value: strategy.confidence,
          confidence: strategy.confidence,
          metadata: {
            strategyType: strategy.type,
            impact: strategy.impact,
          },
        });
      } catch (error) {
        this.logger.error("Failed to execute strategy", {
          error,
          strategyId: strategy.id,
          type: strategy.type,
        });
      }
    }

    return executedStrategies;
  }

  private async executeWeightAdjustment(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const currentWeights = await prisma.searchWeights.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });

      if (!currentWeights) {
        throw new Error("No active weights found");
      }

      // Calculate new weights based on pattern analysis
      const newWeights = {
        ...currentWeights,
        titleWeight:
          currentWeights.titleWeight *
          (1 + strategy.metadata.expectedImprovement),
        contentWeight: currentWeights.contentWeight,
        tagWeight: currentWeights.tagWeight * 1.1, // Boost tag relevance
        active: true,
        metadata: JSON.stringify({
          optimizationId: strategy.id,
          previousWeights: currentWeights,
          confidence: strategy.confidence,
        }),
      };

      // Deactivate current weights
      await prisma.searchWeights.update({
        where: { id: currentWeights.id },
        data: { active: false },
      });

      // Create new weights
      await prisma.searchWeights.create({
        data: newWeights,
      });

      this.logger.info("Executed weight adjustment", {
        strategyId: strategy.id,
        improvement: strategy.metadata.expectedImprovement,
      });
    } catch (error) {
      this.logger.error("Failed to execute weight adjustment", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  private async executeCacheStrategy(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const cacheConfig = {
        ttl: 3600, // 1 hour default
        maxSize: 1000,
        priority: strategy.priority,
      };

      // Update cache rules in search service
      await prisma.searchConfig.upsert({
        where: { key: "cacheRules" },
        create: {
          key: "cacheRules",
          value: JSON.stringify({
            enabled: true,
            rules: [
              {
                pattern: strategy.metadata.searchPattern,
                config: cacheConfig,
              },
            ],
          }),
        },
        update: {
          value: JSON.stringify({
            enabled: true,
            rules: [
              {
                pattern: strategy.metadata.searchPattern,
                config: cacheConfig,
              },
            ],
          }),
        },
      });

      // Record cache strategy metrics
      await this.metrics.recordEngineMetric({
        type: MetricType.CACHE_EFFICIENCY,
        value: strategy.confidence,
        confidence: strategy.confidence,
        metadata: {
          strategyId: strategy.id,
          cacheConfig,
          expectedLatencyImprovement: strategy.metadata.expectedImprovement,
        },
      });

      this.logger.info("Executed cache strategy", {
        strategyId: strategy.id,
        pattern: strategy.metadata.searchPattern,
        config: cacheConfig,
      });
    } catch (error) {
      this.logger.error("Failed to execute cache strategy", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  private async executeQueryTransformation(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const transformationRules = {
        pattern: strategy.metadata.searchPattern,
        boost: strategy.metadata.expectedImprovement,
        priority: strategy.priority,
        confidence: strategy.confidence,
      };

      await prisma.searchConfig.upsert({
        where: { key: "queryTransformations" },
        create: {
          key: "queryTransformations",
          value: JSON.stringify([transformationRules]),
        },
        update: {
          value: JSON.stringify([transformationRules]),
        },
      });

      await this.metrics.recordEngineMetric({
        type: MetricType.MODEL_ACCURACY,
        value: strategy.confidence,
        confidence: strategy.confidence,
        metadata: {
          strategyId: strategy.id,
          transformationType: "query_optimization",
        },
      });
    } catch (error) {
      this.logger.error("Failed to execute query transformation", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  private async executeIndexOptimization(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const indexConfig = {
        fields: ["title", "content", "tags"],
        type: "BTREE",
        priority: strategy.priority,
        searchPattern: strategy.metadata.searchPattern,
      };

      await prisma.searchConfig.upsert({
        where: { key: "indexConfigurations" },
        create: {
          key: "indexConfigurations",
          value: JSON.stringify([indexConfig]),
        },
        update: {
          value: JSON.stringify([indexConfig]),
        },
      });

      await this.metrics.recordEngineMetric({
        type: MetricType.SEARCH_LATENCY,
        value: strategy.metadata.expectedImprovement,
        confidence: strategy.confidence,
        metadata: {
          strategyId: strategy.id,
          indexType: "BTREE",
        },
      });
    } catch (error) {
      this.logger.error("Failed to execute index optimization", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  private async implementFeedbackLoop(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const beforeMetrics = await this.collectPerformanceMetrics();

      // Execute strategy
      await this.executeStrategy(strategy);

      // Wait for impact period
      await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes

      const afterMetrics = await this.collectPerformanceMetrics();
      const impact = this.calculateStrategyImpact(beforeMetrics, afterMetrics);

      if (impact.value < strategy.metadata.expectedImprovement * 0.5) {
        await this.rollbackStrategy(strategy);
        throw new Error("Strategy did not meet performance expectations");
      }

      await prisma.engineLearningResult.update({
        where: { id: strategy.learningResultId },
        data: {
          performance: JSON.stringify({
            beforeMetrics,
            afterMetrics,
            improvement: impact,
          }),
          validatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error("Feedback loop failed", {
        error,
        strategyId: strategy.id,
      });
      await this.rollbackStrategy(strategy);
      throw error;
    }
  }

  private async executeABTest(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    const testConfig = {
      id: `ab_${strategy.id}`,
      variants: {
        control: { weight: 0.5 },
        treatment: {
          weight: 0.5,
          strategyId: strategy.id,
        },
      },
      metrics: strategy.metadata.targetMetrics,
      duration: 3600 * 24, // 24 hours
      minimumSampleSize: 1000,
    };

    try {
      await prisma.experimentConfig.create({
        data: {
          key: testConfig.id,
          value: JSON.stringify(testConfig),
          status: "ACTIVE",
        },
      });

      const results = await this.monitorABTest(testConfig.id, strategy);

      if (results.winner === "treatment") {
        await this.executeStrategy(strategy);
      }

      await prisma.engineLearningResult.update({
        where: { id: strategy.learningResultId },
        data: {
          performance: JSON.stringify({
            abTestResults: results,
            improvement: results.improvement,
            timestamp: new Date().toISOString(),
          }),
          validatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error("A/B test failed", { error, strategyId: strategy.id });
      throw error;
    }
  }

  private async rollbackStrategy(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      switch (strategy.type) {
        case EngineOptimizationType.WEIGHT_ADJUSTMENT:
          await this.rollbackWeights(strategy);
          break;
        case EngineOptimizationType.CACHE_OPTIMIZATION:
          await this.rollbackCache(strategy);
          break;
        case EngineOptimizationType.QUERY_TRANSFORMATION:
          await this.rollbackQueryTransformation(strategy);
          break;
        case EngineOptimizationType.INDEX_OPTIMIZATION:
          await this.rollbackIndexOptimization(strategy);
          break;
      }

      await prisma.engineLearningResult.update({
        where: { id: strategy.learningResultId },
        data: {
          performance: {
            rolledBack: true,
            rollbackReason: "Performance degradation",
          },
        },
      });
    } catch (error) {
      this.logger.error("Strategy rollback failed", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  public async executeStrategy(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      // Validate risk level
      const currentState = await prisma.engineState.findFirst({
        where: { id: this.currentState?.id },
      });

      const metadata = currentState?.metadata as Record<string, unknown>;
      if (
        strategy.metadata.riskLevel === EngineRiskLevel.HIGH &&
        metadata?.riskTolerance === 'low'
      ) {
        throw new Error('High risk strategies are not allowed in current state');
      }

      switch (strategy.type) {
        case EngineOptimizationType.WEIGHT_ADJUSTMENT:
          await this.adjustWeights(strategy);
          break;
        case EngineOptimizationType.CACHE_OPTIMIZATION:
          await this.optimizeCache(strategy);
          break;
        case EngineOptimizationType.QUERY_TRANSFORMATION:
          await this.transformQuery(strategy);
          break;
        case EngineOptimizationType.INDEX_OPTIMIZATION:
          await this.optimizeIndex(strategy);
          break;
      }

      await this.recordStrategyExecution(strategy);
    } catch (error) {
      this.logger.error("Strategy execution failed", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  public async rollbackStrategyPublic(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    return this.rollbackStrategy(strategy);
  }

  protected async collectPerformanceMetrics(): Promise<Record<string, number>> {
    return {
      latency: await this.metrics.getAverageLatency(),
      throughput: await this.metrics.getThroughput(),
      errorRate: await this.metrics.getErrorRate(),
      cpuUsage: await this.metrics.getCPUUsage(),
      memoryUsage: await this.metrics.getMemoryUsage(),
    };
  }

  protected calculateStrategyImpact(
    before: Record<string, number>,
    after: Record<string, number>
  ): ImpactAnalysis {
    // Metric importance weights
    const weights = {
      latency: 0.4,
      throughput: 0.3,
      errorRate: 0.2,
      cpuUsage: 0.05,
      memoryUsage: 0.05,
    };

    // Calculate load-adjusted improvements
    const loadFactor = this.calculateLoadFactor();
    const improvements: Record<string, number> = {};
    let weightedImprovement = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const rawImprovement = (after[metric] - before[metric]) / before[metric];
      const loadAdjusted = rawImprovement * loadFactor;

      improvements[metric] = loadAdjusted;
      weightedImprovement += loadAdjusted * weight;
    }

    // Statistical significance
    const significance = this.calculateStatisticalSignificance(before, after);

    return {
      weightedImprovement,
      improvements,
      significance,
      confidence: this.calculateConfidenceInterval(improvements),
      loadFactor,
      isSignificant: significance > 0.95,
      value: weightedImprovement,
    };
  }

  protected async monitorABTest(
    testId: string,
    strategy: EngineOptimizationStrategy
  ): Promise<ABTestResults> {
    const metrics = await this.collectPerformanceMetrics();
    await prisma.engineLearningResult.update({
      where: { id: strategy.learningResultId },
      data: {
        performance: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return {
      winner: "control" as const,
      improvement: 0.15,
      metrics: {
        control: metrics,
        treatment: metrics,
      },
    };
  }

  protected async rollbackWeights(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const currentWeights = await prisma.searchWeights.findFirst({
        where: {
          active: true,
          metadata: {
            path: ["$"],
            string_contains: strategy.id,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!currentWeights) {
        throw new Error("No weights found for rollback");
      }

      const previousWeights = JSON.parse(
        currentWeights.metadata as string
      ).previousWeights;

      // Deactivate current weights
      await prisma.searchWeights.update({
        where: { id: currentWeights.id },
        data: { active: false },
      });

      // Restore previous weights
      await prisma.searchWeights.create({
        data: {
          ...previousWeights,
          active: true,
          metadata: JSON.stringify({
            rolledBackFrom: strategy.id,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      this.logger.info("Rolled back weight adjustment", {
        strategyId: strategy.id,
      });
    } catch (error) {
      this.logger.error("Failed to rollback weights", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  protected async rollbackCache(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      await prisma.searchConfig.update({
        where: { key: "cacheConfigurations" },
        data: {
          value: JSON.stringify({
            enabled: false,
            rolledBack: true,
            strategyId: strategy.id,
          }),
        },
      });

      await this.metrics.recordEngineMetric({
        type: MetricType.CACHE_HIT_RATE,
        value: 0,
        confidence: 1,
        metadata: {
          strategyId: strategy.id,
          action: "rollback",
        },
      });
    } catch (error) {
      this.logger.error("Failed to rollback cache", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  protected async rollbackQueryTransformation(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const config = await prisma.searchConfig.findUnique({
        where: { key: "queryTransformations" },
      });
      if (config) {
        const transformations = JSON.parse(config.value as string);
        const updatedTransformations = transformations.filter(
          (t: { pattern: string }) => t.pattern !== strategy.metadata.searchPattern
        );

        await prisma.searchConfig.update({
          where: { key: "queryTransformations" },
          data: {
            value: JSON.stringify(updatedTransformations),
          },
        });
      }

      await this.metrics.recordEngineMetric({
        type: MetricType.MODEL_ACCURACY,
        value: 0,
        confidence: 1,
        metadata: {
          strategyId: strategy.id,
          transformationType: "rollback",
        },
      });
    } catch (error) {
      this.logger.error("Failed to rollback query transformation", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  protected async rollbackIndexOptimization(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      const config = await prisma.searchConfig.findUnique({
        where: { key: "indexConfigurations" },
      });
      if (config) {
        const indexConfigs = JSON.parse(config.value as string);
        const updatedConfigs = indexConfigs.filter(
          (c: any) => c.searchPattern !== strategy.metadata.searchPattern
        );

        await prisma.searchConfig.update({
          where: { key: "indexConfigurations" },
          data: {
            value: JSON.stringify(updatedConfigs),
          },
        });
      }

      await this.metrics.recordEngineMetric({
        type: MetricType.SEARCH_LATENCY,
        value: 0,
        confidence: 1,
        metadata: {
          strategyId: strategy.id,
          indexType: "rollback",
        },
      });
    } catch (error) {
      this.logger.error("Failed to rollback index optimization", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  protected groupEventsByType(
    events: LearningEvent[]
  ): Record<string, LearningEvent[]> {
    return events.reduce(
      (groups, event) => {
        const type = event.type;
        groups[type] = groups[type] || [];
        groups[type].push(event);
        return groups;
      },
      {} as Record<string, LearningEvent[]>
    );
  }

  protected async detectPerformancePatterns(
    events: LearningEvent[]
  ): Promise<LearningPattern[]> {
    // Implementation for performance pattern detection
    return [];
  }

  protected static calculatePatternConfidence(pattern: LearningPattern): number {
    // Implementation for calculating pattern confidence
    return 0.8;
  }

  protected async analyzePatternCorrelations(
    patterns: LearningPattern[]
  ): Promise<LearningPattern[]> {
    // Implementation for analyzing pattern correlations
    return patterns;
  }

  protected async calculatePatternCorrelation(
    p1: LearningPattern,
    p2: LearningPattern
  ): Promise<number> {
    const metrics1 = p1.metrics || {};
    const metrics2 = p2.metrics || {};

    const commonMetrics = Object.keys(metrics1).filter(
      (key) => key in metrics2
    );
    if (commonMetrics.length === 0) return 0;

    let correlation = 0;
    for (const metric of commonMetrics) {
      const diff = Math.abs(metrics1[metric] - metrics2[metric]);
      correlation += 1 - diff / Math.max(metrics1[metric], metrics2[metric]);
    }

    return correlation / commonMetrics.length;
  }

  private async updateTestResults(
    strategy: EngineOptimizationStrategy,
    results: ABTestResults
  ): Promise<void> {
    await prisma.engineLearningResult.update({
      where: { id: strategy.learningResultId },
      data: {
        performance: JSON.stringify({
          testResults: results,
          improvement: results.improvement,
          timestamp: new Date().toISOString(),
        }),
        validatedAt: new Date(),
      },
    });
  }

  protected async detectTimeBasedPatterns(
    events: LearningEvent[]
  ): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const timeGroups = this.groupEventsByTimeWindow(events, 3600000); // 1 hour windows

    for (const [timestamp, windowEvents] of Array.from(timeGroups.entries())) {
      if (windowEvents.length < 10) continue; // Minimum sample size

      const avgLatency =
        windowEvents.reduce((sum, e) => sum + (e.metrics?.latency || 0), 0) /
        windowEvents.length;
      const throughput = windowEvents.length;

      patterns.push({
        id: `time_${timestamp}`,
        type: "TIME_BASED",
        confidence: 0.8,
        metrics: {
          averageLatency: avgLatency,
          throughput: throughput,
          eventCount: windowEvents.length,
        },
        features: {
          took: avgLatency,
          totalHits: throughput,
        },
        metadata: {
          source: "time_analysis",
          detectedAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return patterns;
  }

  protected async detectUserBehaviorPatterns(
    events: LearningEvent[]
  ): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const userSessions = this.groupEventsByUserSession(events);

    for (const [sessionId, sessionEvents] of Array.from(userSessions.entries())) {
      const facetsUsed = new Set<string>();
      let relevantHits = 0;
      let totalHits = 0;

      sessionEvents.forEach((event) => {
        if (event.metadata?.facets) {
          event.metadata.facets.forEach((f: string) => facetsUsed.add(f));
        }
        if (event.metadata?.relevantHits)
          relevantHits += event.metadata.relevantHits;
        if (event.metadata?.totalHits) totalHits += event.metadata.totalHits;
      });

      patterns.push({
        id: `behavior_${sessionId}`,
        type: "USER_BEHAVIOR",
        confidence: 0.7,
        metrics: {
          relevanceScore: relevantHits / totalHits,
          facetUsage: facetsUsed.size,
          sessionLength: sessionEvents.length,
        },
        features: {
          relevantHits,
          totalHits,
          facetsUsed: Array.from(facetsUsed),
        },
        metadata: {
          source: "user_behavior",
          detectedAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return patterns;
  }

  private groupEventsByTimeWindow(
    events: LearningEvent[],
    windowSize: number
  ): Map<number, LearningEvent[]> {
    const windows = new Map<number, LearningEvent[]>();

    events.forEach((event) => {
      const timestamp =
        Math.floor(new Date(event.createdAt).getTime() / windowSize) *
        windowSize;
      if (!windows.has(timestamp)) {
        windows.set(timestamp, []);
      }
      windows.get(timestamp)!.push(event);
    });

    return windows;
  }

  private groupEventsByUserSession(
    events: LearningEvent[]
  ): Map<string, LearningEvent[]> {
    const sessions = new Map<string, LearningEvent[]>();

    events.forEach((event: LearningEvent) => {
      const sessionId = event.metadata?.sessionId || "default";
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId)!.push(event);
    });

    return sessions;
  }

  protected async handleStrategyRollback(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    try {
      switch (strategy.type) {
        case EngineOptimizationType.WEIGHT_ADJUSTMENT:
          await this.rollbackWeights(strategy);
          break;
        case EngineOptimizationType.CACHE_OPTIMIZATION:
          await this.rollbackCache(strategy);
          break;
        case EngineOptimizationType.QUERY_TRANSFORMATION:
          await this.rollbackQueryTransformation(strategy);
          break;
        case EngineOptimizationType.INDEX_OPTIMIZATION:
          await this.rollbackIndexOptimization(strategy);
          break;
      }

      await prisma.engineLearningResult.update({
        where: { id: strategy.learningResultId },
        data: {
          performance: JSON.stringify({
            rolledBack: true,
            rollbackReason: "Performance degradation",
            timestamp: new Date().toISOString(),
          }),
        },
      });
    } catch (error) {
      this.logger.error("Strategy rollback failed", {
        error,
        strategyId: strategy.id,
      });
      throw error;
    }
  }

  protected calculateLoadFactor(): number {
    const currentLoad = this.metrics.getCurrentLoad();
    const baselineLoad = this.metrics.getBaselineLoad();
    return currentLoad / baselineLoad;
  }

  protected calculateStatisticalSignificance(
    before: Record<string, number>,
    after: Record<string, number>
  ): number {
    const sampleSize = Object.keys(before).length;
    const tScore = this.calculateTScore(before, after);
    return this.calculatePValue(tScore, sampleSize);
  }

  protected calculateConfidenceInterval(
    improvements: Record<string, number>
  ): number {
    const values = Object.values(improvements);
    const mean = values.reduce((sum: number, n: number) => sum + n) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq: number, n: number) => sq + Math.pow(n - mean, 2), 0) /
        (values.length - 1)
    );
    const marginOfError = 1.96 * (stdDev / Math.sqrt(values.length));
    return 1 - marginOfError;
  }

  protected async calculateRequiredSampleSize(): Promise<number> {
    const baseSize = 1000;
    const variability = await this.metrics.getMetricVariability();
    return Math.ceil(baseSize * (1 + variability));
  }

  protected async calculateOptimalTestDuration(): Promise<number> {
    const trafficVolume = await this.metrics.getAverageTrafficVolume();
    const sampleSize = await this.calculateRequiredSampleSize();
    return Math.ceil((sampleSize / trafficVolume) * 24 * 60 * 60 * 1000); // in ms
  }

  protected async collectTestMetrics(
    testId: string,
    config: {
      sampleSize: number;
      duration: number;
      metrics: string[];
    }
  ): Promise<Record<string, TestMetrics>> {
    const startTime = Date.now() - config.duration;
    return {
      control: await this.metrics.getMetricsForVariant("control", startTime),
      treatment: await this.metrics.getMetricsForVariant(
        "treatment",
        startTime
      ),
    };
  }

  protected analyzeVariant(metrics: TestMetrics): VariantAnalysis {
    return {
      metrics,
      sampleSize: this.calculateEffectiveSampleSize(metrics),
      confidence: this.calculateVariantConfidence(metrics),
    };
  }

  protected determineWinner(
    analysis: Record<string, VariantAnalysis>,
    significance: number
  ): "control" | "treatment" | null {
    if (significance < 0.95) return null;
    return analysis.treatment.metrics.latency < analysis.control.metrics.latency
      ? "treatment"
      : "control";
  }

  protected calculateNetImprovement(
    analysis: Record<string, VariantAnalysis>
  ): number {
    const controlMetrics = analysis.control.metrics;
    const treatmentMetrics = analysis.treatment.metrics;

    return (
      Object.keys(controlMetrics).reduce((total, metric) => {
        const treatmentValue = Number(
          treatmentMetrics[metric as keyof TestMetrics]
        );
        const controlValue = Number(
          controlMetrics[metric as keyof TestMetrics]
        );
        const improvement = (treatmentValue - controlValue) / controlValue;
        return total + improvement;
      }, 0) / Object.keys(controlMetrics).length
    );
  }
  private calculateTScore(
    before: Record<string, number>,
    after: Record<string, number>
  ): number {
    const differences = Object.keys(before).map(
      (key) => after[key] - before[key]
    );
    const meanDiff = differences.reduce((a, b) => a + b) / differences.length;
    const stdDev = Math.sqrt(
      differences.reduce((sq: number, n: number) => sq + Math.pow(n - meanDiff, 2), 0) /
        (differences.length - 1)
    );
    return Math.abs(meanDiff / (stdDev / Math.sqrt(differences.length)));
  }

  private calculatePValue(tScore: number, sampleSize: number): number {
    // Simplified t-distribution calculation
    return 1 / (1 + Math.exp(tScore - Math.log(sampleSize)));
  }

  private calculateEffectiveSampleSize(metrics: TestMetrics): number {
    return Object.keys(metrics).length * 100; // Simplified calculation
  }

  private calculateVariantConfidence(metrics: TestMetrics): number {
    const variability =
      Object.values(metrics).reduce(
        (sum, value) =>
          sum + Math.abs(value - this.calculateMean(Object.values(metrics))),
        0
      ) / Object.values(metrics).length;

    return Math.max(0, Math.min(1, 1 - variability));
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  async pushLearningEvent(event: LearningEvent) {
    await this.config.redis.xadd(
      "nous:learning:stream",
      "*",
      "event",
      JSON.stringify(event)
    );
  }

  private async adjustWeights(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    const currentWeights = await prisma.searchWeights.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!currentWeights) {
      throw new Error("No active weights found");
    }

    const newWeights = {
      ...currentWeights,
      titleWeight:
        currentWeights.titleWeight *
        (1 + strategy.metadata.expectedImprovement),
      contentWeight: currentWeights.contentWeight,
      tagWeight: currentWeights.tagWeight * 1.1,
      active: true,
      metadata: JSON.stringify({
        optimizationId: strategy.id,
        previousWeights: currentWeights,
        confidence: strategy.confidence,
      }),
    };

    await prisma.searchWeights.update({
      where: { id: currentWeights.id },
      data: { active: false },
    });

    await prisma.searchWeights.create({
      data: newWeights,
    });
  }

  private async optimizeCache(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    const cacheConfig = {
      ttl: 3600,
      maxSize: 1000,
      priority: strategy.priority,
    };

    await prisma.searchConfig.upsert({
      where: { key: "cacheConfigurations" },
      create: {
        key: "cacheConfigurations",
        value: JSON.stringify(cacheConfig),
      },
      update: {
        value: JSON.stringify(cacheConfig),
      },
    });
  }

  private async transformQuery(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    const transformationRules = {
      pattern: strategy.metadata.searchPattern,
      priority: strategy.priority,
      confidence: strategy.confidence,
    };

    await prisma.searchConfig.upsert({
      where: { key: "queryTransformations" },
      create: {
        key: "queryTransformations",
        value: JSON.stringify([transformationRules]),
      },
      update: {
        value: JSON.stringify([transformationRules]),
      },
    });
  }

  private async optimizeIndex(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    const indexConfig = {
      fields: ["title", "content", "tags"],
      type: "BTREE",
      priority: strategy.priority,
      searchPattern: strategy.metadata.searchPattern,
    };

    await prisma.searchConfig.upsert({
      where: { key: "indexConfigurations" },
      create: {
        key: "indexConfigurations",
        value: JSON.stringify([indexConfig]),
      },
      update: {
        value: JSON.stringify([indexConfig]),
      },
    });
  }

  private async recordStrategyExecution(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    await prisma.engineLearningResult.update({
      where: { id: strategy.learningResultId },
      data: {
        metadata: JSON.stringify({
          strategyType: strategy.type,
          confidence: strategy.confidence,
          executionTimestamp: new Date().toISOString(),
        }),
        validatedAt: new Date(),
        performance: JSON.stringify({
          status: "EXECUTED",
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }
}
