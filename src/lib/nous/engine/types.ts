import { Logger } from "@/lib/shared/types";
import Redis from "ioredis";
import { z } from "zod";
import { MetricsService } from "../monitoring/metrics";
import {
  LearningEventMetadata,
  LearningEventMetadataSchema,
  LearningEventType,
  LearningPattern,
  LearningPatternSchema,
} from "../types/learning";
import { ModelType } from "../types/models";

export enum EngineStatus {
  INITIALIZING = "INITIALIZING",
  READY = "READY",
  LEARNING = "LEARNING",
  OPTIMIZING = "OPTIMIZING",
  PAUSED = "PAUSED",
  ERROR = "ERROR",
}

export enum EngineOperationType {
  LEARNING = "LEARNING",
  OPTIMIZATION = "OPTIMIZATION",
  VALIDATION = "VALIDATION",
  ROLLBACK = "ROLLBACK",
  PATTERN_DETECTION = "PATTERN_DETECTION",
}

export enum EngineOperationStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum EngineOptimizationType {
  WEIGHT_ADJUSTMENT = "WEIGHT_ADJUSTMENT",
  CACHE_OPTIMIZATION = "CACHE_OPTIMIZATION",
  QUERY_TRANSFORMATION = "QUERY_TRANSFORMATION",
  INDEX_OPTIMIZATION = "INDEX_OPTIMIZATION",
  FEEDBACK_LOOP = "FEEDBACK_LOOP",
  CACHE_STRATEGY = "CACHE_STRATEGY",
}

export enum EngineRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface EngineConfig {
  redis: Redis;
  logger: Logger;
  metrics: MetricsService;
}

export interface EngineMetrics {
  eventType: LearningEventType;
  patternCount: number;
  processingTimeMs: number;
  confidence: number;
}

export interface EngineState {
  id: string;
  status: EngineStatus;
  currentPhase?: string;
  confidence: number;
  lastActive: Date;
  metadata?: Record<string, unknown>;
}

export interface EngineOperation {
  id: string;
  type: EngineOperationType;
  status: EngineOperationStatus;
  startTime: Date;
  endTime?: Date;
  metrics?: Record<string, number>;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PatternAnalysisResult {
  pattern: LearningPattern;
  confidence: number;
  modelType: ModelType;
  metadata: LearningEventMetadata;
}

export interface EngineLearningResult {
  id: string;
  patterns: LearningPattern[];
  confidence: number;
  metadata: LearningEventMetadata;
  recommendations: EngineOptimizationStrategy[];
  appliedAt?: Date;
  validatedAt?: Date;
  performance?: {
    beforeMetrics: Record<string, number>;
    afterMetrics: Record<string, number>;
    improvement: number;
  };
}

export interface EngineOptimizationStrategyMetadata {
  targetMetrics: string[];
  expectedImprovement: number;
  riskLevel: EngineRiskLevel;
  dependencies?: string[];
  searchPattern?: string;
}

export interface EngineOptimizationStrategy {
  id: string;
  type: EngineOptimizationType;
  priority: number;
  confidence: number;
  impact: number;
  metadata: {
    targetMetrics: string[];
    expectedImprovement: number;
    riskLevel: EngineRiskLevel;
    dependencies: string[];
    searchPattern?: string;
  };
  learningResultId: string;
  resultId: string;
}

export interface EngineConfidenceScore {
  value: number;
  factors: {
    patternFrequency: number;
    historicalSuccess: number;
    dataQuality: number;
    patternStability: number;
  };
  metadata: {
    sampleSize: number;
    timeWindow: string;
    lastUpdated: Date;
  };
}

export interface ABTestResults {
  winner: "control" | "treatment";
  improvement: number;
  metrics: {
    control: Record<string, number>;
    treatment: Record<string, number>;
  };
}

export interface ImpactAnalysis {
  weightedImprovement: number;
  improvements: Record<string, number>;
  significance: number;
  confidence: number;
  loadFactor: number;
  isSignificant: boolean;
  value: number;
}

export interface TestMetrics {
  latency: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface VariantAnalysis {
  metrics: TestMetrics;
  sampleSize: number;
  confidence: number;
}

// Zod Schemas
export const EngineStateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(EngineStatus),
  currentPhase: z.string().optional(),
  confidence: z.number().min(0).max(1),
  lastActive: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const EngineOperationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EngineOperationType),
  status: z.nativeEnum(EngineOperationStatus),
  startTime: z.date(),
  endTime: z.date().optional(),
  metrics: z.record(z.number()).optional(),
  metadata: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

export const EngineMetricsSchema = z.object({
  eventType: z.nativeEnum(LearningEventType),
  patternCount: z.number().min(0),
  processingTimeMs: z.number().min(0),
  confidence: z.number().min(0).max(1),
});

export const PatternAnalysisResultSchema = z.object({
  pattern: z.lazy(() => LearningPatternSchema),
  confidence: z.number().min(0).max(1),
  modelType: z.nativeEnum(ModelType),
  metadata: z.lazy(() => LearningEventMetadataSchema),
});

export const EngineLearningResultSchema = z.object({
  id: z.string(),
  patterns: z.array(LearningPatternSchema),
  confidence: z.number().min(0).max(1),
  metadata: LearningEventMetadataSchema,
  recommendations: z.array(z.lazy(() => EngineOptimizationStrategySchema)),
  appliedAt: z.date().optional(),
  validatedAt: z.date().optional(),
  performance: z
    .object({
      beforeMetrics: z.record(z.number()),
      afterMetrics: z.record(z.number()),
      improvement: z.number(),
    })
    .optional(),
});

export const EngineOptimizationStrategySchema = z.object({
  id: z.string(),
  type: z.enum([
    "WEIGHT_ADJUSTMENT",
    "CACHE_OPTIMIZATION",
    "QUERY_TRANSFORMATION",
    "INDEX_OPTIMIZATION",
    "FEEDBACK_LOOP",
  ]),
  priority: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  impact: z.number(),
  metadata: z.object({
    targetMetrics: z.array(z.string()),
    expectedImprovement: z.number(),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    dependencies: z.array(z.string()).optional(),
  }),
});

export const EngineConfidenceScoreSchema = z.object({
  value: z.number().min(0).max(1),
  factors: z.object({
    patternFrequency: z.number().min(0).max(1),
    historicalSuccess: z.number().min(0).max(1),
    dataQuality: z.number().min(0).max(1),
    patternStability: z.number().min(0).max(1),
  }),
  metadata: z.object({
    sampleSize: z.number().min(0),
    timeWindow: z.string(),
    lastUpdated: z.date(),
  }),
});
