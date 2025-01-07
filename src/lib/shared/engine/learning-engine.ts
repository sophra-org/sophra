import { prisma } from '../database/client';
import { Logger } from '../types';
import {
  EngineOperation,
  EngineOperationStatus,
  EngineOperationType,
  EngineOptimizationStrategy,
  LearningEvent,
  LearningPattern,
} from "@prisma/client";
import { BaseEngine } from "./base-engine";
import {
  FeedbackProcessor,
  PerformanceProcessor,
  StrategyProcessor,
  TimeBasedProcessor,
} from "./processors";
import type { ITimeBasedProcessor } from "./processors/time-based-processor";

export interface PatternDetectionResult {
  operation: EngineOperation;
  patterns: LearningPattern[];
}

export interface ProcessorMap {
  feedback: FeedbackProcessor;
  performance: PerformanceProcessor;
  timeBased: ITimeBasedProcessor;
  strategy: StrategyProcessor;
}

export class LearningEngine extends BaseEngine {
  private prisma: typeof prisma;
  private processorMap: ProcessorMap;

  constructor(
    logger: Logger, 
    processorMap: ProcessorMap,
    prismaClient: typeof prisma = prisma
  ) {
    super(logger);
    this.prisma = prismaClient;
    this.processorMap = processorMap;
    // Register processors with base engine
    this.processors = Object.values(processorMap);
  }

  public async executeStrategy(
    strategy: EngineOptimizationStrategy
  ): Promise<void> {
    await this.processorMap.strategy.executeStrategy(strategy);
  }

  async detectPatterns(
    events: LearningEvent[]
  ): Promise<PatternDetectionResult> {
    const operation = await this.prisma.engineOperation.create({
      data: {
        type: EngineOperationType.PATTERN_DETECTION,
        status: EngineOperationStatus.RUNNING,
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      const patterns = await Promise.all([
        this.processorMap.feedback.analyze(events),
        this.processorMap.performance.analyze(events),
        this.processorMap.timeBased.analyze(events),
      ]).then((results) => results.flat());

      const updatedOperation = await this.prisma.engineOperation.update({
        where: { id: operation.id },
        data: {
          status: EngineOperationStatus.COMPLETED,
          endTime: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        operation: updatedOperation,
        patterns,
      };
    } catch (error) {
      await this.prisma.engineOperation.update({
        where: { id: operation.id },
        data: {
          status: EngineOperationStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown error",
          endTime: new Date(),
          updatedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async executeOperation(operation: EngineOperation): Promise<void> {
    try {
      switch (operation.type) {
        case EngineOperationType.PATTERN_DETECTION:
          // Pattern detection is handled by detectPatterns
          break;
        case EngineOperationType.STRATEGY_EXECUTION:
          // Strategy execution is handled by the strategy processor
          break;
        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }
    } catch (error) {
      this.logger.error("Failed to execute operation", { error, operation });
      throw error;
    }
  }

  async getTimeSeriesData(params: {
    startDate: Date;
    endDate: Date;
    granularity: string;
  }) {
    return this.processorMap.timeBased.getTimeSeriesData(params);
  }

  async analyzeTemporalCorrelations(timeSeriesData: any) {
    return this.processorMap.timeBased.analyzeCorrelations(timeSeriesData);
  }

  async findRecurringPatterns(params: {
    timeframe: string;
    minConfidence: number;
  }) {
    return this.processorMap.timeBased.findRecurringPatterns(params);
  }
}
