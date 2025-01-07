import { EngineOptimizationType } from "@/lib/nous/engine/types";
import { z } from "zod";

export enum LearningEventType {
  SEARCH_PATTERN = "SEARCH_PATTERN",
  USER_FEEDBACK = "USER_FEEDBACK",
  MODEL_UPDATE = "MODEL_UPDATE",
  ADAPTATION_RULE = "ADAPTATION_RULE",
  SIGNAL_DETECTED = "SIGNAL_DETECTED",
  METRIC_THRESHOLD = "METRIC_THRESHOLD",
  SYSTEM_STATE = "SYSTEM_STATE",
  EXPERIMENT_RESULT = "EXPERIMENT_RESULT",
}

export enum LearningEventStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  IGNORED = "IGNORED",
}

export enum LearningEventPriority {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

export interface SearchPatternMetadata {
  // Search metrics
  relevantHits?: number;
  totalHits?: number;
  took?: number;
  adaptationRulesApplied?: number;
  searchType?: string;
  facetsUsed?: boolean;

  // Health check fields
  source?: string;

  // Additional metadata
  [key: string]: any; // Allow any additional string-keyed fields
}

// Align with existing SearchPatternMetadata
export interface LearningEventMetadata extends SearchPatternMetadata {
  source?: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  clientId?: string;
  environment?: string;
  version?: string;
  tags?: string[];
  metrics?: Record<string, number>;
  context?: Record<string, unknown>;
}

export interface LearningPattern {
  id: string;
  type: string;
  confidence: number;
  metrics: Record<string, number>;
  features: {
    relevantHits?: number;
    totalHits?: number;
    searchType?: string;
    facetsUsed?: string[];
    took?: number;
  };
  correlations?: Array<{
    patternId: string;
    strength: number;
  }>;
  metadata: {
    source: string;
    detectedAt: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

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

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  status: LearningEventStatus;
  priority: LearningEventPriority;
  timestamp: Date;
  processedAt?: Date;
  metadata: LearningEventMetadata;
  patterns: LearningPattern[];
  correlationId?: string;
  metrics: Record<string, number>;
  sessionId?: string;
  userId?: string;
  clientId?: string;
  environment?: string;
  version?: string;
  tags: string[];
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const LearningEventMetadataSchema = z.object({
  source: z.string().optional(),
  correlationId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metrics: z.record(z.number()).optional(),
  context: z.record(z.unknown()).optional(),
  // SearchPatternMetadata fields
  relevantHits: z.number().optional(),
  totalHits: z.number().optional(),
  took: z.number().optional(),
  adaptationRulesApplied: z.number().optional(),
  searchType: z.string().optional(),
  facetsUsed: z.boolean().optional(),
});

export const LearningPatternSchema = z.object({
  id: z.string(),
  type: z.string(),
  confidence: z.number(),
  features: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LearningEventSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(LearningEventType),
  status: z.nativeEnum(LearningEventStatus),
  priority: z.nativeEnum(LearningEventPriority),
  timestamp: z.date(),
  processedAt: z.date().optional(),
  metadata: LearningEventMetadataSchema,
  patterns: z.array(LearningPatternSchema),
  correlationId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  clientId: z.string().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()),
  error: z.string().optional(),
  retryCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Request/Response types
export interface GetLearningEventsRequest {
  limit?: number;
  type?: LearningEventType;
  status?: LearningEventStatus;
  priority?: LearningEventPriority;
  startDate?: string;
  endDate?: string;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  clientId?: string;
  environment?: string;
  tags?: string[];
}

export interface GetLearningEventsResponse {
  success: boolean;
  data?: LearningEvent[];
  error?: string;
  meta?: {
    total: number;
    timestamp: string;
    limit: number;
  };
}

// Service method types
export interface LearningEventService {
  getEvents(
    request: GetLearningEventsRequest
  ): Promise<GetLearningEventsResponse>;
  createEvent(
    event: Omit<LearningEvent, "id" | "createdAt" | "updatedAt">
  ): Promise<LearningEvent>;
  updateEvent(
    id: string,
    updates: Partial<LearningEvent>
  ): Promise<LearningEvent>;
  deleteEvent(id: string): Promise<void>;
}
