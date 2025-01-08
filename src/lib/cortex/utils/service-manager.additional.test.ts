import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServiceManager, serviceManager } from './service-manager';
import { MetricsService } from '@lib/cortex/monitoring/metrics';
import { ElasticsearchService } from '@lib/cortex/elasticsearch/services';
import { VectorizationService } from '@lib/cortex/services/vectorization';
import { RedisClient } from '@lib/cortex/redis/client';
import { RedisCacheService } from '@lib/cortex/redis/services';
import { PostgresDataService } from '@lib/cortex/postgres/services';
import { prisma } from '@lib/shared/database/client';
import Redis from 'ioredis';

// Mock dependencies
vi.mock('ioredis');
vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@lib/cortex/monitoring/metrics', () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    observeMetric: vi.fn(),
    getEngineMetrics: vi.fn().mockResolvedValue({
      totalOperations: 100,
      successfulOperations: 95,
      failedOperations: 5,
      pendingOperations: 0,
      averageLatency: 50,
      requestsPerSecond: 10,
      errorRate: 0.05,
      cpuUsage: 0.6,
      memoryUsage: 0.4,
    }),
  })),
}));

describe('ServiceManager Additional Tests', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      ELASTICSEARCH_URL: 'http://localhost:9200',
      SOPHRA_ES_API_KEY: 'test-key',
      SOPHRA_REDIS_URL: 'redis://localhost:6379',
      OPENAI_API_KEY: 'test-openai-key',
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('Singleton Pattern', () => {
    it('should create only one instance', () => {
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should expose singleton instance through serviceManager', () => {
      const instance = ServiceManager.getInstance();
      expect(serviceManager).toBe(instance);
    });
  });

  describe('Service Initialization', () => {
    it('should initialize Redis with correct configuration', async () => {
      const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockResolvedValue('PONG'),
      };
      vi.mocked(Redis).mockImplementation(() => mockRedis as any);

      await serviceManager.getServices();

      expect(Redis).toHaveBeenCalledWith(
        'redis://localhost:6379',
        expect.objectContaining({
          maxRetriesPerRequest: 3,
          connectTimeout: 10000,
          commandTimeout: 5000,
        })
      );

      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should handle Redis initialization errors', async () => {
      process.env.SOPHRA_REDIS_URL = '';

      await expect(serviceManager.getServices()).rejects.toThrow(
        'Missing SOPHRA_REDIS_URL environment variable'
      );
    });

    it('should cache initialized services', async () => {
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();

      expect(services1).toBe(services2);
      expect(Redis).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent initialization requests', async () => {
      const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockResolvedValue('PONG'),
      };
      vi.mocked(Redis).mockImplementation(() => mockRedis as any);

      const promises = Array(5)
        .fill(null)
        .map(() => serviceManager.getServices());

      const results = await Promise.all(promises);

      // All promises should resolve to the same services instance
      expect(new Set(results).size).toBe(1);
      // Redis should only be initialized once
      expect(Redis).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Checks', () => {
    it('should check all connections successfully', async () => {
      const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockResolvedValue('PONG'),
      };
      vi.mocked(Redis).mockImplementation(() => mockRedis as any);
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

      const status = await serviceManager.checkConnections();

      expect(status).toEqual({
        redis: true,
        elasticsearch: true,
        postgres: true,
      });
    });

    it('should handle Redis connection failure', async () => {
      const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockRejectedValue(new Error('Redis error')),
      };
      vi.mocked(Redis).mockImplementation(() => mockRedis as any);

      const status = await serviceManager.checkConnections();

      expect(status.redis).toBe(false);
    });

    it('should handle Elasticsearch connection failure', async () => {
      vi.mocked(Redis).mockImplementation(
        () =>
          ({
            on: vi.fn(),
            ping: vi.fn().mockResolvedValue('PONG'),
          } as any)
      );

      const mockElasticsearchClient = {
        ping: vi.fn().mockRejectedValue(new Error('ES error')),
      };
      vi.spyOn(require('@elastic/elasticsearch'), 'Client').mockImplementation(
        () => mockElasticsearchClient
      );

      const status = await serviceManager.checkConnections();

      expect(status.elasticsearch).toBe(false);
    });

    it('should handle Postgres connection failure', async () => {
      vi.mocked(Redis).mockImplementation(
        () =>
          ({
            on: vi.fn(),
            ping: vi.fn().mockResolvedValue('PONG'),
          } as any)
      );
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('PG error'));

      const status = await serviceManager.checkConnections();

      expect(status.postgres).toBe(false);
    });
  });

  describe('Service Management', () => {
    it('should create all required services', async () => {
      const mockRedis = {
        on: vi.fn(),
        ping: vi.fn().mockResolvedValue('PONG'),
      };
      vi.mocked(Redis).mockImplementation(() => mockRedis as any);

      const services = await serviceManager.getServices();

      expect(services.elasticsearch).toBeDefined();
      expect(services.redis).toBeDefined();
      expect(services.postgres).toBeDefined();
      expect(services.vectorization).toBeDefined();
      expect(services.sync).toBeDefined();
      expect(services.analytics).toBeDefined();
      expect(services.metrics).toBeDefined();
      expect(services.abTesting).toBeDefined();
      expect(services.feedback).toBeDefined();
      expect(services.sessions).toBeDefined();
    });

    it('should handle engine test service', async () => {
      const services = await serviceManager.getServices();
      const result = await services.engine.testService();

      expect(result).toEqual({
        operational: true,
        latency: expect.any(Number),
        errors: [],
        metrics: {
          status: 'active',
          uptime: expect.any(Number),
          operations: {
            total: 100,
            successful: 95,
            failed: 5,
            pending: 0,
          },
          performance: {
            latency: 50,
            throughput: 10,
            errorRate: 0.05,
            cpuUsage: 0.6,
            memoryUsage: 0.4,
          },
        },
      });
    });

    it('should handle engine test service errors', async () => {
      vi.mocked(MetricsService.getEngineMetrics).mockRejectedValue(
        new Error('Metrics error')
      );

      const services = await serviceManager.getServices();
      const result = await services.engine.testService();

      expect(result).toEqual({
        operational: false,
        latency: expect.any(Number),
        errors: ['Metrics error'],
        metrics: {
          status: 'error',
          uptime: expect.any(Number),
          operations: {
            total: 0,
            successful: 0,
            failed: 0,
            pending: 0,
          },
          performance: {
            latency: 0,
            throughput: 0,
            errorRate: 1,
            cpuUsage: 0,
            memoryUsage: 0,
          },
        },
      });
    });
  });
});
