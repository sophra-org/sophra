import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

export const createMockPrismaClient = () => ({
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  engineState: {
    findFirst: vi.fn().mockResolvedValue({
      id: "state1",
      status: "READY",
      confidence: 0.8,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentPhase: null,
      metadata: "{}"
    }),
    create: vi.fn().mockResolvedValue({
      id: "state1",
      status: "READY",
      confidence: 0.8,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentPhase: null,
      metadata: "{}"
    }),
    update: vi.fn().mockResolvedValue({
      id: "state1",
      status: "READY",
      confidence: 0.8,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      currentPhase: null,
      metadata: "{}"
    })
  },
  engineOperation: {
    create: vi.fn().mockResolvedValue({
      id: 'test-operation',
      type: 'PATTERN_DETECTION',
      status: 'RUNNING',
      startTime: new Date(),
      endTime: null,
      metrics: {},
      metadata: {},
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    update: vi.fn().mockResolvedValue({}),
    findMany: vi.fn().mockResolvedValue([])
  },
  learningEvent: {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    findMany: vi.fn().mockResolvedValue([])
  },
  learningPattern: {
    create: vi.fn().mockResolvedValue({
      id: 'test-pattern',
      type: 'TEST_PATTERN',
      confidence: 0.8,
      features: {},
      metadata: {},
      eventId: 'test-event',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    findMany: vi.fn().mockResolvedValue([])
  },
  experimentConfig: {
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({})
  },
  engineLearningResult: {
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({})
  },
  searchWeights: {
    findFirst: vi.fn().mockResolvedValue({
      id: 'weights1',
      titleWeight: 1.0,
      contentWeight: 0.8,
      tagWeight: 0.6,
      active: true,
      metadata: "{}",
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({})
  },
  searchConfig: {
    upsert: vi.fn().mockResolvedValue({})
  },
  index: {
    findUnique: vi.fn().mockResolvedValue({
      name: 'test-index',
      id: '',
      status: '',
      settings: null,
      mappings: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      doc_count: 0,
      size_bytes: 0,
      health: ''
    }),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn()
  }
});

export const mockPrisma = createMockPrismaClient();

// Export the mock client type for use in other files
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

// Export the mock Prisma client configuration for use in vi.mock
export const __prismaClient = {
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  EngineOperationType: {
    PATTERN_DETECTION: 'PATTERN_DETECTION',
    STRATEGY_EXECUTION: 'STRATEGY_EXECUTION',
    LEARNING: 'LEARNING'
  },
  EngineOperationStatus: {
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  EngineRiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  },
  MetricType: {
    REDIS_GET: 'REDIS_GET',
    REDIS_ERROR: 'REDIS_ERROR',
    SEARCH_LATENCY: 'SEARCH_LATENCY',
    SEARCH_THROUGHPUT: 'SEARCH_THROUGHPUT',
    SEARCH_ERROR: 'SEARCH_ERROR',
    SEARCH_RELEVANCE: 'SEARCH_RELEVANCE',
    SEARCH_COVERAGE: 'SEARCH_COVERAGE',
    SEARCH_DIVERSITY: 'SEARCH_DIVERSITY',
    SEARCH_FRESHNESS: 'SEARCH_FRESHNESS',
    SEARCH_QUALITY: 'SEARCH_QUALITY'
  },
  LearningEventType: {
    SEARCH: 'SEARCH',
    CLICK: 'CLICK',
    CONVERSION: 'CONVERSION',
    FEEDBACK: 'FEEDBACK'
  },
  LearningEventStatus: {
    PENDING: 'PENDING',
    PROCESSED: 'PROCESSED',
    FAILED: 'FAILED'
  },
  LearningEventPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH'
  },
  ExperimentStatus: {
    DRAFT: 'DRAFT',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE'
  }
};
