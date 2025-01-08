import { describe, it, expect } from 'vitest';
import {
  EngineStateSchema,
  EngineOperationSchema,
  EngineMetricsSchema,
  PatternAnalysisResultSchema,
  EngineLearningResultSchema,
  EngineOptimizationStrategySchema,
  EngineConfidenceScoreSchema,
  EngineStatus,
  EngineOperationType,
  EngineOperationStatus,
  EngineOptimizationType,
  EngineRiskLevel,
} from './types';
import { ModelType } from '../types/models';
import { LearningEventType } from '../types/learning';

describe('Engine Types Schema Validation', () => {
  describe('EngineStateSchema', () => {
    it('should validate valid engine state', () => {
      const validState = {
        id: 'state-1',
        status: EngineStatus.READY,
        confidence: 0.9,
        lastActive: new Date(),
        metadata: { version: '1.0' },
      };

      const result = EngineStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    it('should reject invalid confidence values', () => {
      const invalidState = {
        id: 'state-1',
        status: EngineStatus.READY,
        confidence: 1.5, // Invalid: > 1
        lastActive: new Date(),
      };

      const result = EngineStateSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });

    it('should handle optional fields', () => {
      const minimalState = {
        id: 'state-1',
        status: EngineStatus.READY,
        confidence: 0.8,
        lastActive: new Date(),
      };

      const result = EngineStateSchema.safeParse(minimalState);
      expect(result.success).toBe(true);
    });
  });

  describe('EngineOperationSchema', () => {
    it('should validate valid operation', () => {
      const validOperation = {
        id: 'op-1',
        type: EngineOperationType.LEARNING,
        status: EngineOperationStatus.COMPLETED,
        startTime: new Date(),
        endTime: new Date(),
        metrics: { duration: 1000 },
        metadata: { source: 'test' },
      };

      const result = EngineOperationSchema.safeParse(validOperation);
      expect(result.success).toBe(true);
    });

    it('should handle operation without end time', () => {
      const ongoingOperation = {
        id: 'op-1',
        type: EngineOperationType.LEARNING,
        status: EngineOperationStatus.IN_PROGRESS,
        startTime: new Date(),
      };

      const result = EngineOperationSchema.safeParse(ongoingOperation);
      expect(result.success).toBe(true);
    });

    it('should validate error field', () => {
      const failedOperation = {
        id: 'op-1',
        type: EngineOperationType.LEARNING,
        status: EngineOperationStatus.FAILED,
        startTime: new Date(),
        error: 'Operation timeout',
      };

      const result = EngineOperationSchema.safeParse(failedOperation);
      expect(result.success).toBe(true);
    });
  });

  describe('EngineMetricsSchema', () => {
    it('should validate valid metrics', () => {
      const validMetrics = {
        eventType: LearningEventType.SEARCH_PATTERN,
        patternCount: 5,
        processingTimeMs: 1000,
        confidence: 0.95,
      };

      const result = EngineMetricsSchema.safeParse(validMetrics);
      expect(result.success).toBe(true);
    });

    it('should reject negative values', () => {
      const invalidMetrics = {
        eventType: LearningEventType.SEARCH_PATTERN,
        patternCount: -1,
        processingTimeMs: 1000,
        confidence: 0.95,
      };

      const result = EngineMetricsSchema.safeParse(invalidMetrics);
      expect(result.success).toBe(false);
    });
  });

  describe('PatternAnalysisResultSchema', () => {
    it('should validate valid analysis result', () => {
      const validResult = {
        pattern: {
          id: 'pattern-1',
          type: 'high_relevance',
          confidence: 0.9,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        confidence: 0.95,
        modelType: ModelType.SEARCH_RANKER,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      };

      const result = PatternAnalysisResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });
  });

  describe('EngineLearningResultSchema', () => {
    it('should validate valid learning result', () => {
      const validResult = {
        id: 'result-1',
        patterns: [],
        confidence: 0.9,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
        recommendations: [],
      };

      const result = EngineLearningResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate performance data', () => {
      const resultWithPerformance = {
        id: 'result-1',
        patterns: [],
        confidence: 0.9,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
        recommendations: [],
        performance: {
          beforeMetrics: { latency: 100 },
          afterMetrics: { latency: 80 },
          improvement: 0.2,
        },
      };

      const result = EngineLearningResultSchema.safeParse(resultWithPerformance);
      expect(result.success).toBe(true);
    });
  });

  describe('EngineOptimizationStrategySchema', () => {
    it('should validate valid strategy', () => {
      const validStrategy = {
        id: 'strategy-1',
        type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
        priority: 0.8,
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          targetMetrics: ['latency', 'throughput'],
          expectedImprovement: 0.2,
          riskLevel: EngineRiskLevel.LOW,
          dependencies: [],
        },
      };

      const result = EngineOptimizationStrategySchema.safeParse(validStrategy);
      expect(result.success).toBe(true);
    });

    it('should validate priority and confidence ranges', () => {
      const invalidStrategy = {
        id: 'strategy-1',
        type: EngineOptimizationType.WEIGHT_ADJUSTMENT,
        priority: 1.5, // Invalid: > 1
        confidence: 0.9,
        impact: 0.7,
        metadata: {
          targetMetrics: ['latency'],
          expectedImprovement: 0.2,
          riskLevel: EngineRiskLevel.LOW,
          dependencies: [],
        },
      };

      const result = EngineOptimizationStrategySchema.safeParse(invalidStrategy);
      expect(result.success).toBe(false);
    });
  });

  describe('EngineConfidenceScoreSchema', () => {
    it('should validate valid confidence score', () => {
      const validScore = {
        value: 0.9,
        factors: {
          patternFrequency: 0.8,
          historicalSuccess: 0.9,
          dataQuality: 0.95,
          patternStability: 0.85,
        },
        metadata: {
          sampleSize: 1000,
          timeWindow: '24h',
          lastUpdated: new Date(),
        },
      };

      const result = EngineConfidenceScoreSchema.safeParse(validScore);
      expect(result.success).toBe(true);
    });

    it('should validate factor ranges', () => {
      const invalidScore = {
        value: 0.9,
        factors: {
          patternFrequency: 1.2, // Invalid: > 1
          historicalSuccess: 0.9,
          dataQuality: 0.95,
          patternStability: 0.85,
        },
        metadata: {
          sampleSize: 1000,
          timeWindow: '24h',
          lastUpdated: new Date(),
        },
      };

      const result = EngineConfidenceScoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });

    it('should validate sample size', () => {
      const invalidScore = {
        value: 0.9,
        factors: {
          patternFrequency: 0.8,
          historicalSuccess: 0.9,
          dataQuality: 0.95,
          patternStability: 0.85,
        },
        metadata: {
          sampleSize: -1, // Invalid: < 0
          timeWindow: '24h',
          lastUpdated: new Date(),
        },
      };

      const result = EngineConfidenceScoreSchema.safeParse(invalidScore);
      expect(result.success).toBe(false);
    });
  });
});
