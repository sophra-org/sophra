import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ServiceManager } from './service-manager';
import { mockPrisma } from '../../../../vitest.setup';
import Redis from 'ioredis';
import { Client } from '@elastic/elasticsearch';

// Mock all imported services
vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue(true)
  }))
}));

vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    on: vi.fn(),
    disconnect: vi.fn()
  }));
  return RedisMock;
});

// Mock environment variables
const mockEnv = {
  NODE_ENV: 'test',
  SOPHRA_REDIS_URL: 'redis://localhost:6379',
  ELASTICSEARCH_URL: 'http://localhost:9200',
  SOPHRA_ES_API_KEY: 'test-key',
  OPENAI_API_KEY: 'test-openai-key'
};

describe('ServiceManager', () => {
  beforeEach(() => {
    // Setup environment variables
    process.env = { ...mockEnv };
    
    // Clear all mocks
    vi.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ count: 1 }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ServiceManager.getInstance();
      const instance2 = ServiceManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getServices', () => {
    it('should initialize services successfully', async () => {
      const serviceManager = ServiceManager.getInstance();
      const services = await serviceManager.getServices();

      expect(services).toBeDefined();
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

    it('should reuse existing services on subsequent calls', async () => {
      const serviceManager = ServiceManager.getInstance();
      const services1 = await serviceManager.getServices();
      const services2 = await serviceManager.getServices();
      expect(services1).toBe(services2);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock Redis to throw an error
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Redis connection failed');
      });

      const serviceManager = ServiceManager.getInstance();
      await expect(serviceManager.getServices()).rejects.toThrow('Redis connection failed');
    });

    it('should wait for initialization if already in progress', async () => {
      const serviceManager = ServiceManager.getInstance();
      
      // Start two initialization processes
      const promise1 = serviceManager.getServices();
      const promise2 = serviceManager.getServices();

      const [services1, services2] = await Promise.all([promise1, promise2]);
      expect(services1).toBe(services2);
    });
  });

  describe('checkConnections', () => {
    it('should return true for all connections when healthy', async () => {
      const serviceManager = ServiceManager.getInstance();
      const status = await serviceManager.checkConnections();

      expect(status).toEqual({
        redis: true,
        elasticsearch: true,
        postgres: true
      });
    });

    it('should handle Redis connection failure', async () => {
      // Mock Redis ping to fail
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => ({
        ping: vi.fn().mockRejectedValue(new Error('Redis error')),
        on: vi.fn()
      }));

      const serviceManager = ServiceManager.getInstance();
      const status = await serviceManager.checkConnections();

      expect(status.redis).toBe(false);
    });

    it('should handle Elasticsearch connection failure', async () => {
      // Mock Elasticsearch ping to fail
      (Client as unknown as jest.Mock).mockImplementationOnce(() => ({
        ping: vi.fn().mockRejectedValue(new Error('Elasticsearch error'))
      }));

      const serviceManager = ServiceManager.getInstance();
      const status = await serviceManager.checkConnections();

      expect(status.elasticsearch).toBe(false);
    });

    it('should handle Postgres connection failure', async () => {
      // Mock Prisma query to fail
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Postgres error'));

      const serviceManager = ServiceManager.getInstance();
      const status = await serviceManager.checkConnections();

      expect(status.postgres).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when Redis URL is missing', async () => {
      process.env.SOPHRA_REDIS_URL = '';
      
      const serviceManager = ServiceManager.getInstance();
      await expect(serviceManager.getServices()).rejects.toThrow('Missing SOPHRA_REDIS_URL environment variable');
    });

    it('should handle Redis connection errors', async () => {
      const mockRedis = {
        ping: vi.fn().mockRejectedValue(new Error('Connection failed')),
        on: vi.fn(),
        disconnect: vi.fn()
      };
      (Redis as unknown as jest.Mock).mockImplementationOnce(() => mockRedis);

      const serviceManager = ServiceManager.getInstance();
      const status = await serviceManager.checkConnections();
      
      expect(status.redis).toBe(false);
      expect(mockRedis.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });
