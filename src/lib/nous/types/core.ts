import { SignalType } from "@prisma/client";

export { SignalType } from "./signals";

export enum EventType {
  SYSTEM = "system",
  USER = "user",
  STATE_CHANGE = "state_change",
  SEARCH = "search",
  MODEL = "model",
  FEEDBACK = "feedback",
  ADAPTATION = "adaptation",
  LEARNING = "learning",
}

/**
 * Severity levels for notifications and logging
 */
export enum Severity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Core metric types
 */
export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Core event structure
 */
export interface Event {
  type: EventType;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Core signal structure
 */
export interface Signal {
  id: string;
  source: string;
  type: SignalType;
  strength: number;
  timestamp: Date;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * System state transitions
 */
export interface StateTransition {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
