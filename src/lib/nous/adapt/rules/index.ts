import logger from "@/lib/shared/logger";
import type { Logger } from "@/lib/shared/types";
import { Condition, Rule, RuleContext } from "../types";

export class RuleRegistry {
  private rules: Map<string, Rule>;
  private logger: Logger & { service: string };

  constructor() {
    this.rules = new Map();
    this.logger = logger as Logger & { service: string };
  }

  register(rule: Rule): void {
    this.rules.set(rule.name, rule);
  }

  unregister(ruleName: string): void {
    this.rules.delete(ruleName);
  }

  getRuleCount(): number {
    return this.rules.size;
  }

  getRule(ruleName: string): Rule | undefined {
    return this.rules.get(ruleName);
  }

  async executeTriggered(context: RuleContext): Promise<void> {
    const triggeredRules = this.evaluateAll(context);

    for (const rule of triggeredRules) {
      try {
        await rule.execute(context);
        rule.lastTriggered = new Date();
      } catch (error) {
        this.logger.error(`Rule execution failed: ${rule.name}`, { error });
      }
    }
  }

  private evaluateAll(context: RuleContext): Rule[] {
    const triggered: Rule[] = [];

    for (const rule of this.rules.values()) {
      if (rule.enabled && rule.evaluate(context)) {
        triggered.push(rule);
      }
    }

    return triggered.sort((a, b) => a.priority - b.priority);
  }
}

export class ThresholdCondition implements Condition {
  constructor(
    private metricName: string,
    private threshold: number,
    private operator: "gt" | "lt" | "gte" | "lte" | "eq" = "gt"
  ) {}

  evaluate(context: RuleContext): boolean {
    const value = context.metrics[this.metricName];
    if (value === undefined) return false;

    switch (this.operator) {
      case "gt":
        return value > this.threshold;
      case "lt":
        return value < this.threshold;
      case "gte":
        return value >= this.threshold;
      case "lte":
        return value <= this.threshold;
      case "eq":
        return value === this.threshold;
      default:
        return false;
    }
  }
}

export class EventCondition implements Condition {
  constructor(
    private eventType: string,
    private properties: Record<string, unknown> = {}
  ) {}

  evaluate(context: RuleContext): boolean {
    if (context.eventData.type !== this.eventType) {
      return false;
    }

    return Object.entries(this.properties).every(
      ([key, value]) => context.eventData[key] === value
    );
  }
}
