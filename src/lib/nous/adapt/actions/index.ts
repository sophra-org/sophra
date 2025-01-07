import logger from "@/lib/shared/logger";
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

  execute(context: RuleContext): void {
    Object.assign(context.systemState, this.updates);
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

  constructor(config: {
    metricName: string;
    adjustment: number;
    minValue?: number;
    maxValue?: number;
  }, logger: Logger) {
    this.metricName = config.metricName;
    this.adjustment = config.adjustment;
    this.minValue = config.minValue;
    this.maxValue = config.maxValue;
    this.logger = logger;
  }

  execute(context: RuleContext): void {
    const current = context.metrics[this.metricName] || 0;
    let newValue = current + this.adjustment;

    if (this.minValue !== undefined) {
      newValue = Math.max(newValue, this.minValue);
    }
    if (this.maxValue !== undefined) {
      newValue = Math.min(newValue, this.maxValue);
    }

    context.metrics[this.metricName] = newValue;
    this.logger.info(`Adjusted ${this.metricName}`, {
      from: current,
      to: newValue,
    });
  }
}
