import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsAdapter } from './metrics-adapter';
import { MetricsService } from '../../../cortex/monitoring/metrics';
import type { Logger } from '../../../shared/types';

// Create mock functions
const mockFns = {
  getAverageLatency: vi.fn(),
  getThroughput: vi.fn(),
  getErrorRate: vi.fn(),
  getCPUUsage: vi.fn(),
  getMemoryUsage: vi.fn(),
  recordEngineMetric: vi.fn(),
  recordLearningMetrics: vi.fn(),
  getCurrentLoad: vi.fn(),
  getBaselineLoad: vi.fn(),
  recordMetric: vi.fn(),
  getMetric: vi.fn(),
  initialize: vi.fn(),
  shutdown: vi.fn()
};

// Create mock types
type MockFunctions = typeof mockFns;
interface MockMetricsService {
  // Mock functions
  getAverageLatency: ReturnType<typeof vi.fn>;
  getThroughput: ReturnType<typeof vi.fn>;
  getErrorRate: ReturnType<typeof vi.fn>;
  getCPUUsage: ReturnType<typeof vi.fn>;
  getMemoryUsage: ReturnType<typeof vi.fn>;
  recordEngineMetric: ReturnType<typeof vi.fn>;
  recordLearningMetrics: ReturnType<typeof vi.fn>;
  getCurrentLoad: ReturnType<typeof vi.fn>;
  getBaselineLoad: ReturnType<typeof vi.fn>;
  recordMetric: ReturnType<typeof vi.fn>;
  getMetric: ReturnType<typeof vi.fn>;
  initialize: ReturnType<typeof vi.fn>;
  shutdown: ReturnType<typeof vi.fn>;
  
  // Required properties
  logger: Logger;
  registry: Map<any, any>;
  errorCounter: number;
  operationLatency: number;
  metricsEnabled: boolean;
  samplingRate: number;
  batchSize: number;
  flushInterval: number;
  abTestMetrics: Map<string, any>;
  analyticsMetrics: Map<string, any>;
  searchFeedback: Map<string, any>;
  metrics: Map<string, any>;
}

describe('MetricsAdapter', () => {
  let metricsAdapter: MetricsAdapter;
  let mockMetricsService: MockMetricsService;
  let mockLogger: Logger;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      child: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn()
      }),
      service: 'test'
    } as unknown as Logger;

    // Setup mock function implementations
    mockFns.getAverageLatency.mockResolvedValue(100);
    mockFns.getThroughput.mockResolvedValue(1000);
    mockFns.getErrorRate.mockResolvedValue(0.01);
    mockFns.getCPUUsage.mockResolvedValue(0.5);
    mockFns.getMemoryUsage.mockResolvedValue(0.7);
    mockFns.getCurrentLoad.mockResolvedValue(0.5);
    mockFns.getBaselineLoad.mockResolvedValue(0.3);
    mockFns.recordEngineMetric.mockResolvedValue(undefined);
    mockFns.recordLearningMetrics.mockResolvedValue(undefined);
    mockFns.recordMetric.mockResolvedValue(undefined);
    mockFns.getMetric.mockResolvedValue(null);
    mockFns.initialize.mockResolvedValue(undefined);
    mockFns.shutdown.mockResolvedValue(undefined);

    // Create mock metrics service
    mockMetricsService = {
      ...mockFns,
      logger: mockLogger,
      registry: new Map(),
      errorCounter: 0,
      operationLatency: 0,
      metricsEnabled: true,
      samplingRate: 1.0,
      batchSize: 100,
      flushInterval: 5000,
      abTestMetrics: new Map(),
      analyticsMetrics: new Map(),
      searchFeedback: new Map(),
      metrics: new Map()
    };

    // Mock MetricsService
    vi.mock("../../../cortex/monitoring/metrics", () => ({
      MetricsService: vi.fn().mockImplementation(() => mockMetricsService)
    }));

    // Clear all mocks before each test
    vi.clearAllMocks();

    metricsAdapter = new MetricsAdapter(mockMetricsService as unknown as MetricsService, mockLogger);
  });

  describe('configuration', () => {
    it('should have default sample rate and batch size', () => {
      expect(metricsAdapter.sampleRate).toBe(1.0);
      expect(metricsAdapter.batchSize).toBe(100);
    });
  });

  describe('metric retrieval', () => {
    it('should get average latency', async () => {
      const latency = await metricsAdapter.getAverageLatency();
      expect(latency).toBe(100);
      expect(mockMetricsService.getAverageLatency).toHaveBeenCalled();
    });

    it('should get throughput', async () => {
      const throughput = await metricsAdapter.getThroughput();
      expect(throughput).toBe(1000);
      expect(mockMetricsService.getThroughput).toHaveBeenCalled();
    });

    it('should get error rate', async () => {
      const errorRate = await metricsAdapter.getErrorRate();
      expect(errorRate).toBe(0.01);
      expect(mockMetricsService.getErrorRate).toHaveBeenCalled();
    });

    it('should get CPU usage', async () => {
      const cpuUsage = await metricsAdapter.getCPUUsage();
      expect(cpuUsage).toBe(0.5);
      expect(mockMetricsService.getCPUUsage).toHaveBeenCalled();
    });

    it('should get memory usage', async () => {
      const memoryUsage = await metricsAdapter.getMemoryUsage();
      expect(memoryUsage).toBe(0.7);
      expect(mockMetricsService.getMemoryUsage).toHaveBeenCalled();
    });
  });

  describe('metric recording', () => {
    it('should record engine metrics', async () => {
      const metricData = {
        type: 'TEST_METRIC',
        value: 42,
        timestamp: new Date(),
        confidence: 1.0
      };

      await metricsAdapter.recordEngineMetric(metricData);
      expect(mockMetricsService.recordEngineMetric).toHaveBeenCalledWith(metricData);
    });

    it('should record learning metrics', async () => {
      const learningData = {
        modelId: 'test-model',
        accuracy: 0.95,
        loss: 0.05,
        metrics: {
          precision: 0.94,
          recall: 0.93
        }
      };

      await metricsAdapter.recordLearningMetrics(learningData);
      expect(mockMetricsService.recordLearningMetrics).toHaveBeenCalledWith(learningData);
    });
  });
});
