import { RuleContext, RulePriority } from "@/lib/nous/adapt/types";

export interface AdaptationRule {
  id: string;
  name: string;
  description: string;
  type: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  actions: Array<{
    type: string;
    parameters: Record<string, unknown>;
  }>;
  priority: RulePriority;
  enabled: boolean;
  lastTriggered?: Date;
}

export interface AdaptationContext extends RuleContext {
  event: Record<string, unknown>;
  systemState: Record<string, unknown>;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface AdaptationResult {
  ruleId: string;
  success: boolean;
  actionsTaken: string[];
  context: AdaptationContext;
  timestamp: Date;
}

export interface AdaptationMetrics {
  rulesEvaluated: number;
  successfulAdaptations: number;
  failedAdaptations: number;
  averageEvaluationTime: number;
  lastEvaluationTime?: Date;
}
