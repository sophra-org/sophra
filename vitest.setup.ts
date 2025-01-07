import { vi, Mock } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Create base mock methods for all models
const baseMethods = {
  create: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  upsert: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
} as const;

// Mock Prisma client with all models from schema
const mockPrisma = {
  document: { ...baseMethods },
  migration: { ...baseMethods },
  searchAnalytics: { ...baseMethods },
  session: { ...baseMethods },
  conversation: { ...baseMethods },
  message: { ...baseMethods },
  aBTest: { ...baseMethods },
  aBTestAssignment: { ...baseMethods },
  aBTestMetric: { ...baseMethods },
  searchFeedback: { ...baseMethods },
  baseEvent: { ...baseMethods },
  modelEvent: { ...baseMethods },
  processedSignal: { ...baseMethods },
  signalBatch: { ...baseMethods },
  signalPattern: { ...baseMethods },
  adaptationRule: { ...baseMethods },
  modelConfig: { ...baseMethods },
  modelVersion: { ...baseMethods },
  learningRequest: { ...baseMethods },
  feedbackRequest: { ...baseMethods },
  modelMetrics: { ...baseMethods },
  modelState: { ...baseMethods },
  searchEvent: { ...baseMethods },
  aBTestMetrics: { ...baseMethods },
  signal: { ...baseMethods },
  analyticsMetrics: { ...baseMethods },
  analyticsTrend: { ...baseMethods },
  performanceInsight: { ...baseMethods },
  analyticsReport: { ...baseMethods },
  adaptationSuggestion: { ...baseMethods },
  learningMetric: { ...baseMethods },
  learningEvent: { ...baseMethods },
  learningPattern: { ...baseMethods },
  engineState: { ...baseMethods },
  engineOperation: { ...baseMethods },
  engineMetric: { ...baseMethods },
  engineLearningResult: { ...baseMethods },
  engineOptimizationStrategy: { ...baseMethods },
  engineConfidenceScore: { ...baseMethods },
  searchWeights: { ...baseMethods },
  searchConfig: { ...baseMethods },
  experimentConfig: { ...baseMethods },
  engineRecommendation: { ...baseMethods },
  index: { ...baseMethods },
  user: { ...baseMethods },
  account: { ...baseMethods },
  authSession: { ...baseMethods },
  verificationToken: { ...baseMethods },
  apiKey: { ...baseMethods },
  adminToken: { ...baseMethods },
  sessionToSignal: { ...baseMethods },
  $transaction: vi.fn((callback: (tx: typeof mockPrisma) => Promise<any>) => callback(mockPrisma)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  $reset: vi.fn(),
} as unknown as jest.Mocked<PrismaClient>;

// Mock @prisma/client with all enums from schema
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  EventType: {
    SYSTEM: 'SYSTEM',
    USER: 'USER',
    STATE_CHANGE: 'STATE_CHANGE',
    SEARCH: 'SEARCH',
    MODEL: 'MODEL',
    FEEDBACK: 'FEEDBACK',
    ADAPTATION: 'ADAPTATION',
    LEARNING: 'LEARNING',
  },
  SignalType: {
    SEARCH: 'SEARCH',
    PERFORMANCE: 'PERFORMANCE',
    USER_BEHAVIOR_IMPRESSION: 'USER_BEHAVIOR_IMPRESSION',
    USER_BEHAVIOR_VIEW: 'USER_BEHAVIOR_VIEW',
    USER_BEHAVIOR_CLICK: 'USER_BEHAVIOR_CLICK',
    USER_BEHAVIOR_CONVERSION: 'USER_BEHAVIOR_CONVERSION',
    MODEL_PERFORMANCE: 'MODEL_PERFORMANCE',
    FEEDBACK: 'FEEDBACK',
    SYSTEM_HEALTH: 'SYSTEM_HEALTH',
    SESSION: 'SESSION',
  },
  EngagementType: {
    IMPRESSION: 'IMPRESSION',
    VIEW: 'VIEW',
    CLICK: 'CLICK',
    CONVERSION: 'CONVERSION',
  },
  Severity: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL',
  },
  ModelType: {
    SEARCH_RANKER: 'SEARCH_RANKER',
    PATTERN_DETECTOR: 'PATTERN_DETECTOR',
    QUERY_OPTIMIZER: 'QUERY_OPTIMIZER',
    FEEDBACK_ANALYZER: 'FEEDBACK_ANALYZER',
    OPENAI_FINE_TUNED: 'OPENAI_FINE_TUNED',
  },
  RulePriority: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },
  ExperimentStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    STOPPED: 'STOPPED',
    FAILED: 'FAILED',
  },
  MetricType: {
    FEEDBACK_SCORE: 'FEEDBACK_SCORE',
    ENGAGEMENT_RATE: 'ENGAGEMENT_RATE',
    RELEVANCE_SCORE: 'RELEVANCE_SCORE',
    CLICK_THROUGH: 'CLICK_THROUGH',
    CONVERSION_RATE: 'CONVERSION_RATE',
    SEARCH_LATENCY: 'SEARCH_LATENCY',
    MODEL_ACCURACY: 'MODEL_ACCURACY',
    ADAPTATION_SUCCESS: 'ADAPTATION_SUCCESS',
    CACHE_EFFICIENCY: 'CACHE_EFFICIENCY',
    CACHE_HIT_RATE: 'CACHE_HIT_RATE',
    REDIS_GET: 'REDIS_GET',
    REDIS_SET: 'REDIS_SET',
    REDIS_DELETE: 'REDIS_DELETE',
    REDIS_EXISTS: 'REDIS_EXISTS',
    REDIS_ERROR: 'REDIS_ERROR',
    ERROR_RATE: 'ERROR_RATE',
    THROUGHPUT: 'THROUGHPUT',
    CPU_USAGE: 'CPU_USAGE',
    MEMORY_USAGE: 'MEMORY_USAGE',
  },
  LearningEventType: {
    SEARCH_PATTERN: 'SEARCH_PATTERN',
    USER_FEEDBACK: 'USER_FEEDBACK',
    MODEL_UPDATE: 'MODEL_UPDATE',
    ADAPTATION_RULE: 'ADAPTATION_RULE',
    SIGNAL_DETECTED: 'SIGNAL_DETECTED',
    METRIC_THRESHOLD: 'METRIC_THRESHOLD',
    SYSTEM_STATE: 'SYSTEM_STATE',
    EXPERIMENT_RESULT: 'EXPERIMENT_RESULT',
    PATTERN_DETECTION: 'PATTERN_DETECTION',
    STRATEGY_GENERATION: 'STRATEGY_GENERATION',
    FEEDBACK_ANALYSIS: 'FEEDBACK_ANALYSIS',
    MODEL_TRAINING: 'MODEL_TRAINING',
    SYSTEM_ADAPTATION: 'SYSTEM_ADAPTATION',
  },
  LearningEventStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    IGNORED: 'IGNORED',
  },
  LearningEventPriority: {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },
  EngineOptimizationType: {
    WEIGHT_ADJUSTMENT: 'WEIGHT_ADJUSTMENT',
    QUERY_TRANSFORMATION: 'QUERY_TRANSFORMATION',
    INDEX_OPTIMIZATION: 'INDEX_OPTIMIZATION',
    CACHE_STRATEGY: 'CACHE_STRATEGY',
  },
  EngineRiskLevel: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },
  EngineOperationType: {
    PATTERN_DETECTION: 'PATTERN_DETECTION',
    STRATEGY_EXECUTION: 'STRATEGY_EXECUTION',
    RULE_EVALUATION: 'RULE_EVALUATION',
    ADAPTATION: 'ADAPTATION',
    LEARNING_CYCLE: 'LEARNING_CYCLE',
  },
  EngineOperationStatus: {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}));

// Mock database client
vi.mock('./src/lib/shared/database/client', () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

// Export mockPrisma for test files to use directly
export { mockPrisma };

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset all model methods
  Object.entries(mockPrisma).forEach(([key, model]) => {
    // Only reset methods for Prisma models, not utility methods like $transaction
    if (typeof model === 'object' && model !== null && !key.startsWith('$')) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as Mock).mockReset();
        }
      });
    }
  });
  // Reset transaction mock
  mockPrisma.$transaction.mockReset();
  mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => Promise<any>) => callback(mockPrisma));
  // Reset connection mocks
  mockPrisma.$connect.mockReset();
  mockPrisma.$disconnect.mockReset();
});
