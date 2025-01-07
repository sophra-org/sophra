import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Redis module
vi.mock('ioredis', () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const RedisSpy = vi.fn().mockImplementation(() => ({
    get: mockGet,
    set: mockSet,
    connect: mockConnect,
    disconnect: mockDisconnect
  }));

  // Make mock functions available to tests
  (global as any).mockGet = mockGet;
  (global as any).mockSet = mockSet;
  (global as any).mockConnect = mockConnect;
  (global as any).mockDisconnect = mockDisconnect;
  (global as any).RedisSpy = RedisSpy;

  return { default: RedisSpy };
});

import { RedisAdapter } from './redis-adapter';
import { MetricsService } from '../../../cortex/monitoring/metrics';
import { MetricType } from '@prisma/client';
import type { Redis as RedisType } from 'ioredis';

// Get mock functions from global scope
const mockGet = (global as any).mockGet;
const mockSet = (global as any).mockSet;
const mockConnect = (global as any).mockConnect;
const mockDisconnect = (global as any).mockDisconnect;
const RedisSpy = (global as any).RedisSpy;

// Create type for mocked Redis client
interface MockRedisClient {
  get: typeof mockGet;
  set: typeof mockSet;
  connect: typeof mockConnect;
  disconnect: typeof mockDisconnect;
}

describe('RedisAdapter', () => {
  let redisAdapter: RedisAdapter;
  let mockMetricsService: MetricsService;
  let mockRedisClient: MockRedisClient;

  beforeEach(() => {
    // Create mock metrics service
    mockMetricsService = {
      recordEngineMetric: vi.fn(),
      recordMetric: vi.fn(),
      getAverageLatency: vi.fn().mockResolvedValue(100),
      getThroughput: vi.fn().mockResolvedValue(1000),
      getErrorRate: vi.fn().mockResolvedValue(0.01),
      getCPUUsage: vi.fn().mockResolvedValue(0.5),
      getMemoryUsage: vi.fn().mockResolvedValue(0.7),
      getCurrentLoad: vi.fn().mockResolvedValue(0.5),
      getBaselineLoad: vi.fn().mockResolvedValue(0.3),
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn()
      },
      registry: new Map(),
      errorCounter: 0,
      operationLatency: 0,
      metricsEnabled: true,
      samplingRate: 1.0,
      batchSize: 100,
      flushInterval: 5000,
      initialize: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined)
    } as unknown as MetricsService;

    // Clear mock implementations
    vi.clearAllMocks();

    // Create Redis client mock
    mockRedisClient = {
      get: mockGet,
      set: mockSet,
      connect: mockConnect,
      disconnect: mockDisconnect
    };

    // Create adapter with mocked dependencies
    redisAdapter = new RedisAdapter(mockMetricsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should successfully get a value and record metrics', async () => {
      // Arrange
      const mockValue = 'test-value';
      mockGet.mockResolvedValueOnce(mockValue);
      const key = 'test-key';

      // Act
      const result = await redisAdapter.get(key);

      // Assert
      expect(result).toBe(mockValue);
      expect(mockMetricsService.recordEngineMetric).toHaveBeenCalledWith({
        type: MetricType.REDIS_GET,
        value: expect.any(Number),
        confidence: 1
      });
    });

    it('should handle null values correctly', async () => {
      // Arrange
      mockGet.mockResolvedValueOnce(null);
      const key = 'non-existent-key';

      // Act
      const result = await redisAdapter.get(key);

      // Assert
      expect(result).toBeNull();
      expect(mockMetricsService.recordEngineMetric).toHaveBeenCalledWith({
        type: MetricType.REDIS_GET,
        value: expect.any(Number),
        confidence: 1
      });
    });

    it('should record error metrics when Redis operation fails', async () => {
      // Arrange
      const error = new Error('Redis connection failed');
      mockGet.mockRejectedValueOnce(error);
      const key = 'test-key';

      // Act & Assert
      await expect(redisAdapter.get(key)).rejects.toThrow('Redis connection failed');
      expect(mockMetricsService.recordEngineMetric).toHaveBeenCalledWith({
        type: MetricType.REDIS_ERROR,
        value: 1,
        confidence: 1,
        metadata: { error: 'Error: Redis connection failed' }
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with default values when environment variables are not set', () => {
      // Arrange & Act
      const adapter = new RedisAdapter(mockMetricsService);

      // Assert
      expect(adapter).toBeDefined();
      expect(RedisSpy).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
        password: undefined,
        db: 0
      });
    });

    it('should initialize with custom environment variables', () => {
      // Arrange
      process.env.REDIS_HOST = 'custom-host';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret';
      process.env.REDIS_DB = '1';

      // Act
      const adapter = new RedisAdapter(mockMetricsService);

      // Assert
      expect(adapter).toBeDefined();
      expect(RedisSpy).toHaveBeenCalledWith({
        host: 'custom-host',
        port: 6380,
        password: 'secret',
        db: 1
      });

      // Cleanup
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      delete process.env.REDIS_DB;
    });
  });
});
