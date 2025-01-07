import { Logger } from "@/lib/shared/types";
import { LearningEvent, LearningPattern } from "@prisma/client";
import { MetricsAdapter } from "../adapters/metrics-adapter";

export abstract class BaseProcessor {
  constructor(
    protected logger: Logger,
    protected metrics: MetricsAdapter
  ) {}

  abstract analyze(events: LearningEvent[]): Promise<LearningPattern[]>;

  protected calculateConfidence(pattern: Partial<LearningPattern>): number {
    const baseConfidence = 0.5;
    const metrics = pattern.features as Record<string, number>;
    const metricsAverage =
      Object.values(metrics).reduce((sum, val) => sum + val, 0) /
      Math.max(Object.keys(metrics).length, 1);

    return Math.min(Math.max(baseConfidence + metricsAverage * 0.1, 0), 1);
  }
}
