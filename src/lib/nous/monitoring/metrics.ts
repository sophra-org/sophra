import { prisma } from "@/lib/shared/database/client";
import { Logger } from "@/lib/shared/types";
import { MetricType } from "@prisma/client";
import { TestMetrics } from "../engine/types";

export interface MetricsServiceConfig {
  logger: Logger;
  sampleRate?: number;
  batchSize?: number;
}

export class MetricsService {
  private readonly logger: Logger;
  private readonly sampleRate: number;
  private readonly batchSize: number;
  private metricsQueue: Array<{
    type: "engine" | "learning";
    data: any;
  }> = [];

  constructor(config: MetricsServiceConfig) {
    this.logger = config.logger;
    this.sampleRate = config.sampleRate || 1.0;
    this.batchSize = config.batchSize || 100;
  }

  async recordEngineMetric(data: {
    type: MetricType;
    value: number;
    confidence: number;
    metadata?: Record<string, unknown>;
    operationId?: string;
  }): Promise<void> {
    const engineLogger = this.logger.child({ context: 'engine-metrics' });

    try {
      if (Math.random() >= this.sampleRate) {
        engineLogger.debug("Skipping metric due to sampling", { 
          type: data.type,
          sampleRate: this.sampleRate 
        });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.engineMetric.create({
          data: {
            type: data.type,
            value: data.value,
            confidence: data.confidence,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            operationId: data.operationId,
            timestamp: new Date(),
          },
        });
      });

      engineLogger.info("Successfully recorded engine metric", {
        type: data.type,
        value: data.value,
        confidence: data.confidence,
        operationId: data.operationId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      engineLogger.error("Failed to record engine metric", { 
        error: errorMessage,
        data,
        sampleRate: this.sampleRate 
      });
      throw new Error(`Database error: Failed to record engine metric - ${errorMessage}`);
    }
  }

  async recordLearningMetrics(data: {
    type: MetricType;
    value: number;
    interval: string;
    sessionId?: string;
    modelId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const learningLogger = this.logger.child({ context: 'learning-metrics' });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.learningMetric.create({
          data: {
            type: data.type,
            value: data.value,
            interval: data.interval,
            sessionId: data.sessionId,
            modelId: data.modelId,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            timestamp: new Date(),
            timeframe: "1h",
            aggregated: false,
          },
        });
      });

      learningLogger.info("Successfully recorded learning metric", {
        type: data.type,
        value: data.value,
        interval: data.interval,
        sessionId: data.sessionId,
        modelId: data.modelId,
        metadata: data.metadata ? true : false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      learningLogger.error("Failed to record learning metric", { 
        error: errorMessage,
        data,
        metadata: data.metadata ? true : false 
      });
      throw new Error(`Database error: Failed to record learning metric - ${errorMessage}`);
    }
  }

  async getMetricsForVariant(variant: string, startTime: number): Promise<TestMetrics> {
    try {
      const metrics = await prisma.engineMetric.findMany({
        where: {
          metadata: {
            contains: variant,
          },
          timestamp: {
            gte: new Date(startTime),
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: 100,
      });

      return this.aggregateTestMetrics(metrics);
    } catch (error) {
      this.logger.error("Failed to get metrics for variant", { error, variant });
      throw new Error("Database error: Failed to get variant metrics");
    }
  }

  private aggregateTestMetrics(metrics: any[]): TestMetrics {
    return {
      latency: this.calculateAverage(metrics.filter(m => m.type === "LATENCY")),
      errorRate: this.calculateAverage(metrics.filter(m => m.type === "ERROR_RATE")),
      throughput: this.calculateAverage(metrics.filter(m => m.type === "THROUGHPUT")),
      cpuUsage: this.calculateAverage(metrics.filter(m => m.type === "CPU_USAGE")),
      memoryUsage: this.calculateAverage(metrics.filter(m => m.type === "MEMORY_USAGE")),
    };
  }

  private calculateAverage(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
}
