import { vi } from 'vitest';

// Mock Prisma client
vi.mock('@/lib/shared/database/client', () => {
  const mockPrisma = new (vi.mocked(require('@prisma/client')).PrismaClient)();
  return {
    default: mockPrisma,
    prisma: mockPrisma,
  };
});

// Mock @prisma/client
vi.mock('@prisma/client', () => {
  class MockPrismaClient {
    engineMetric = {
      create: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    };
    learningMetric = {
      create: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    };
    modelState = {
      findMany: vi.fn(),
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    };
    modelConfig = {
      findUnique: vi.fn(),
    };
    engineState = {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    $transaction = vi.fn((callback) => callback(this));
  }

  return {
    PrismaClient: MockPrismaClient,
    ModelType: {
      SEARCH_RANKER: 'SEARCH_RANKER',
      FEEDBACK_RANKER: 'FEEDBACK_RANKER',
      PERFORMANCE_RANKER: 'PERFORMANCE_RANKER',
    },
    SignalType: {
      SEARCH: 'SEARCH',
      FEEDBACK: 'FEEDBACK',
      PERFORMANCE: 'PERFORMANCE',
    },
    MetricType: {
      LATENCY: 'LATENCY',
      ERROR_RATE: 'ERROR_RATE',
      THROUGHPUT: 'THROUGHPUT',
      CPU_USAGE: 'CPU_USAGE',
      MEMORY_USAGE: 'MEMORY_USAGE',
    },
    Prisma: {
      JsonValue: {},
      InputJsonValue: {},
      JsonNull: null,
    },
  };
});

// Mock js-yaml
vi.mock('js-yaml', () => {
  const mockYaml = {
    load: vi.fn(),
    dump: vi.fn(),
  };
  return {
    default: mockYaml,
    ...mockYaml,
  };
});

// Mock logger
vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

// Mock ioredis
vi.mock('ioredis', () => {
  class MockRedis {
    quit = vi.fn();
    connect = vi.fn();
    constructor() {
      return Object.assign(this, {
        // Add any additional Redis methods needed by tests
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
      });
    }
  }
  return {
    default: MockRedis,
    Redis: MockRedis,
  };
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});