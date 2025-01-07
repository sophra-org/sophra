import { z } from "zod";

export enum RulePriority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
}

export const RuleContextSchema = z.object({
  timestamp: z.date(),
  eventData: z.record(z.unknown()),
  systemState: z.record(z.unknown()),
  metrics: z.record(z.number()),
  metadata: z.record(z.unknown()).optional(),
});

export type RuleContext = z.infer<typeof RuleContextSchema>;

export interface Condition {
  evaluate(context: RuleContext): boolean;
}

export interface Action {
  execute(context: RuleContext): void;
}

export interface Rule {
  name: string;
  description: string;
  priority: RulePriority;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  lastTriggered?: Date;
  evaluate(context: RuleContext): boolean;
  execute(context: RuleContext): void;
}
