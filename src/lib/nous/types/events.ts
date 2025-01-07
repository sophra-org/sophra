import { EventType } from './core';

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  data: Record<string, unknown>;
  source: string;
  priority?: number;
  processed?: boolean;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface ModelEvent extends BaseEvent {
  type: EventType.MODEL;
  modelId: string;
  version: string;
  parameters: Record<string, unknown>;
  metrics: Record<string, number>;
  results: Array<Record<string, unknown>>;
}

export interface SearchEvent extends BaseEvent {
  type: EventType.SEARCH;
  query: string;
  results: Record<string, unknown>;
}

export interface EventProcessor {
  process(): void;
  batchProcess(events: BaseEvent[]): Promise<BaseEvent[]>;
}
