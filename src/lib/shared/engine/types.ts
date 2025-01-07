import { LearningEvent, LearningPattern } from "@prisma/client";
import { JsonValue } from "type-fest";

export enum EngineOperationType {
  PATTERN_DETECTION = 'PATTERN_DETECTION',
  STRATEGY_EXECUTION = 'STRATEGY_EXECUTION',
  RULE_EVALUATION = 'RULE_EVALUATION',
  ADAPTATION = 'ADAPTATION',
  LEARNING_CYCLE = 'LEARNING_CYCLE'
}

export enum EngineOperationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
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

export interface RuleContext {
  timestamp: Date;
  eventData: Record<string, unknown>;
  systemState: Record<string, unknown>;
  metrics: Record<string, number>;
  metadata: {
    metric_history: Record<string, Array<[Date, number]>>;
    event_history: Array<Record<string, unknown>>;
    signal_history: Array<Record<string, unknown>>;
  };
}

export interface Rule {
  name: string;
  condition: (context: RuleContext) => boolean;
  action: (context: RuleContext) => Promise<void>;
  priority?: number;
}

export interface EngineMetrics {
  type: string;
  value: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface PatternDetectionResult {
  operation: EngineOperation;
  patterns: LearningPattern[];
} 