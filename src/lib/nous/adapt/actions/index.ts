import type { Logger } from "@/lib/shared/types";
import { Action, RuleContext } from "../types";

export interface NotifyActionConfig {
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  channels?: string[];
}

export class NotifyAction implements Action {
  private config: NotifyActionConfig;
  private logger: Logger;

  constructor(config: NotifyActionConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  execute(context: RuleContext): void {
    const notification = {
      ...this.config,
      timestamp: context.timestamp,
      eventData: context.eventData,
      metrics: context.metrics,
    };

    // TODO: Implement actual notification dispatch
    this.logger.info("Would send notification:", notification);
  }
}

export class UpdateStateAction implements Action {
  private updates: Record<string, unknown>;

  constructor(updates: Record<string, unknown>) {
    this.updates = updates;
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): void {
    for (const key in source) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        if (!(key in target)) {
          target[key] = {};
        }
        this.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        target[key] = source[key];
      }
    }
  }

  execute(context: RuleContext): void {
    this.deepMerge(context.systemState, this.updates);
  }
}

export class CompositeAction implements Action {
  private actions: Action[];
  private logger: Logger;

  constructor(actions: Action[], logger: Logger) {
    this.actions = actions;
    this.logger = logger;
  }

  execute(context: RuleContext): void {
    for (const action of this.actions) {
      try {
        action.execute(context);
      } catch (error) {
        this.logger.error(`Action failed:`, { error });
      }
    }
  }
}

export class ThresholdAdjustmentAction implements Action {
  private metricName: string;
  private adjustment: number;
  private minValue?: number;
  private maxValue?: number;
  private logger: Logger;

  constructor(
    config: {
      metricName: string;
      adjustment: number;
      minValue?: number;
      maxValue?: number;
    },
    logger: Logger
  ) {
    this.metricName = config.metricName;
    this.adjustment = config.adjustment;
    this.minValue = config.minValue;
    this.maxValue = config.maxValue;
    this.logger = logger;
  }

  execute(context: RuleContext): void {
    const current = context.metrics[this.metricName] ?? 0;
    const newValue = current + this.adjustment;

    let finalValue = newValue;
    if (this.minValue !== undefined) {
      finalValue = Math.max(finalValue, this.minValue);
    }
    if (this.maxValue !== undefined) {
      finalValue = Math.min(finalValue, this.maxValue);
    }

    context.metrics[this.metricName] = finalValue;
    this.logger.info(`Adjusted ${this.metricName}`, {
      from: current,
      to: finalValue,
    });
  }
}
