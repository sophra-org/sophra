import { NotifyAction } from "@/lib/nous/adapt/actions";
import { RuleRegistry } from "@/lib/nous/adapt/rules";
import { Action, Rule, RuleContext, RulePriority } from "@/lib/nous/adapt/types";
import { Logger } from "@/lib/shared/types";
import { EngineOperation, EngineOperationType, LearningEvent, LearningPattern } from "@prisma/client";
import { BaseEngine } from "./base-engine";

export interface PatternDetectionResult {
  operation: EngineOperation;
  patterns: LearningPattern[];
}

export class AdaptationEngine extends BaseEngine {
  private registry: RuleRegistry;
  protected state: Record<string, unknown> = {};
  protected metrics: Record<string, number> = {};
  protected metricHistory: Map<string, Array<[Date, number]>> = new Map();
  protected eventHistory: Array<Record<string, unknown>> = [];
  protected signalHistory: Array<Record<string, unknown>> = [];
  protected running: boolean = false;
  protected lastRun: Date = new Date();
  protected threadPool: { execute: (fn: () => Promise<void>) => Promise<void> };

  constructor(logger: Logger, registry?: RuleRegistry) {
    super(logger);
    this.registry = registry || new RuleRegistry();
    this.threadPool = {
      execute: async (fn) => await fn(),
    };
  }

  addRule(rule: Rule): void {
    this.registry.register(rule);
    this.logger.debug('Adding rule:', rule.name);
  }

  removeRule(ruleName: string): void {
    this.registry.unregister(ruleName);
    this.logger.debug('Removing rule:', ruleName);
  }

  public async executeOperation(operation: EngineOperation): Promise<void> {
    try {
      switch (operation.type) {
        case EngineOperationType.RULE_EVALUATION:
          if (operation.metadata && typeof operation.metadata === 'object' && 'rule' in operation.metadata) {
            const ruleName = operation.metadata.rule as string;
            const rule = { 
              name: ruleName,
              description: 'Auto-generated rule from operation',
              priority: RulePriority.MEDIUM,
              conditions: [],
              actions: [{
                execute: async (context: RuleContext) => {}
              }],
              enabled: true,
              evaluate: (context: RuleContext) => true,
              execute: async (context: RuleContext) => {
                for (const action of rule.actions) {
                  action.execute(context);
                }
              }
            };
            this.addRule(rule);
          }
          break;

        case EngineOperationType.ADAPTATION:
          const notifyAction = new NotifyAction(
            {
              title: "Adaptation Action",
              message: operation.metadata && typeof operation.metadata === 'object' && 'message' in operation.metadata ? operation.metadata.message as string : "Executing adaptation action",
              severity: "info",
              channels: ["ops"],
            },
            this.logger
          );
          await notifyAction.execute(this.createContext({ type: operation.type }));
          break;

        case EngineOperationType.PATTERN_DETECTION:
          throw new Error('Unsupported operation type');

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const context = this.createContext({ type: operation.type });
      await this.registry.executeTriggered(context);
    } catch (error) {
      this.logger.error("Error executing operation:", { error, operation });
      throw error;
    }
  }

  async detectPatterns(events: LearningEvent[]): Promise<PatternDetectionResult> {
    if (!events.length) {
      return {
        operation: {} as EngineOperation,
        patterns: []
      };
    }

    // Create a pattern from the first event
    const event = events[0];
    const pattern: LearningPattern = {
      id: `pattern-${event.id}`,
      type: 'SYSTEM_STATE_PATTERN',
      confidence: 0.9,
      features: {
        eventType: event.type,
        status: event.status,
        priority: event.priority
      },
      metadata: event.metadata,
      eventId: event.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      operation: {
        id: `op-${event.id}`,
        type: EngineOperationType.PATTERN_DETECTION,
        status: 'COMPLETED',
        metadata: event.metadata,
        error: null,
        startTime: new Date(),
        endTime: new Date(),
        metrics: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as EngineOperation,
      patterns: [pattern]
    };
  }

  public updateMetrics(newMetrics: Record<string, number>): void {
    const timestamp = new Date();
    Object.entries(newMetrics).forEach(([key, value]) => {
      this.metrics[key] = value;
      if (!this.metricHistory.has(key)) {
        this.metricHistory.set(key, []);
      }
      this.metricHistory.get(key)?.push([timestamp, value]);
    });
    this.logger.debug("Updated metrics", { metrics: newMetrics });
  }

  public updateState(newState: Record<string, unknown>): void {
    this.state = { ...this.state, ...newState };
    this.logger.debug("Updated state", { state: newState });
  }

  public async evaluateEvent(eventData: Record<string, unknown>): Promise<void> {
    try {
      const context = this.createContext(eventData);
      await this.registry.executeTriggered(context);
    } catch (error) {
      this.logger.error("Error during rule evaluation:", { error });
      const notifyAction = new NotifyAction(
        {
          title: "Rule Evaluation Error",
          message: `Error during rule evaluation: ${error}`,
          severity: "error",
          channels: ["ops"],
        },
        this.logger
      );
      await notifyAction.execute(this.createContext(eventData));
    }
  }

  private createContext(eventData: Record<string, unknown>): RuleContext {
    return {
      timestamp: new Date(),
      eventData,
      systemState: this.state,
      metrics: this.metrics,
      metadata: {
        metric_history: Object.fromEntries(this.metricHistory),
        event_history: this.eventHistory,
        signal_history: this.signalHistory,
      },
    };
  }

  async start(evaluationInterval: number = 1000): Promise<void> {
    this.running = true;

    while (this.running) {
      try {
        await this.evaluateEvent({ type: "periodic_check" });
      } catch (error) {
        this.logger.error("Error in adaptation engine loop:", { error });
      }
      await new Promise((resolve) => setTimeout(resolve, evaluationInterval));
    }
  }
}
