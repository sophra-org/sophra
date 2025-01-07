import { EngineOptimizationType } from "@prisma/client";

export interface EngineOptimizationStrategy {
  id: string;
  type: EngineOptimizationType;
  priority: number;
  confidence: number;
  impact: number;
  metadata: {
    targetMetrics: string[];
    expectedImprovement: number;
    riskLevel: string;
    dependencies: string[];
    searchPattern?: string;
  };
  learningResultId: string;
  resultId: string;
}
