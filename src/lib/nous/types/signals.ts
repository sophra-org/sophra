import { z } from "zod";

export const SignalMetadataSchema = z.object({
  documentType: z.string(),
  timeToClick: z.number(),
  deviceType: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

export const SignalDataSchema = z.object({
  sessionId: z.string(),
  queryId: z.string(),
  resultId: z.string(),
  position: z.number(),
  metadata: SignalMetadataSchema,
});

export const SignalSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum([
    "SEARCH",
    "PERFORMANCE",
    "USER_BEHAVIOR_IMPRESSION",
    "USER_BEHAVIOR_VIEW",
    "USER_BEHAVIOR_CLICK",
    "USER_BEHAVIOR_CONVERSION",
    "MODEL_PERFORMANCE",
    "FEEDBACK",
    "SYSTEM_HEALTH",
  ]),
  source: z.string(),
  value: SignalDataSchema,
  timestamp: z.coerce.date(),
  processed: z.boolean().default(false),
  processedAt: z.coerce.date().nullable().optional(),
  error: z.string().nullable().optional(),
  metadata: z.object({
    status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
    attempts: z.number(),
  }),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export interface BaseSignal {
  id: string;
  type: SignalType;
  timestamp: Date;
  strength: number; // 0.0 to 1.0
  data: Record<string, unknown>;
  source: string;
  priority?: number;
  processed?: boolean;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface ProcessedSignal extends BaseSignal {
  originalSignalId: string;
  processingTime: number;
  transformations: string[];
  confidence: number;
  processed: true;
  processingMetadata?: Record<string, unknown>;
}

export interface SignalBatch {
  batchId: string;
  signals: BaseSignal[];
  startTime: Date;
  endTime: Date;
  metadata: Record<string, unknown>;
  priority?: number;
  sourceSystem?: string;
}

export interface SignalPattern {
  patternId: string;
  signals: BaseSignal[];
  confidence: number;
  patternType: string;
  frequency?: number;
  impactScore?: number;
  metadata?: Record<string, unknown>;
  relatedPatterns: string[];
}

export interface SignalProcessor {
  process(signal: BaseSignal): Promise<ProcessedSignal>;
  batchProcess(signals: BaseSignal[]): Promise<ProcessedSignal[]>;
  validate(signal: BaseSignal): boolean;
}

export enum SignalType {
  SEARCH = "SEARCH",
  PERFORMANCE = "PERFORMANCE",
  USER_BEHAVIOR_IMPRESSION = "USER_BEHAVIOR_IMPRESSION",
  USER_BEHAVIOR_VIEW = "USER_BEHAVIOR_VIEW",
  USER_BEHAVIOR_CLICK = "USER_BEHAVIOR_CLICK",
  USER_BEHAVIOR_CONVERSION = "USER_BEHAVIOR_CONVERSION",
  MODEL_PERFORMANCE = "MODEL_PERFORMANCE",
  FEEDBACK = "FEEDBACK",
  SYSTEM_HEALTH = "SYSTEM_HEALTH"
}

export enum SignalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
