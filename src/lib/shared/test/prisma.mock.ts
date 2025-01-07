import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

export const createMockPrismaClient = () => ({
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
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
  }
});

export const mockPrisma = createMockPrismaClient();

// Mock Prisma Client and enums
vi.mock('@prisma/client', () => ({
  default: {
    PrismaClient: vi.fn(() => mockPrisma)
  },
  PrismaClient: vi.fn(() => mockPrisma),
  prisma: mockPrisma,
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  // Mock the required enums
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
    REDIS_ERROR: 'REDIS_ERROR'
  }
}));
