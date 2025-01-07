import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SophraClient } from './client';
import { ElasticClient } from '@/lib/cortex/elasticsearch/client';
import { RedisClient } from '@/lib/cortex/redis/client';
import { prisma } from '@/lib/shared/database/client';
import type { Logger } from '@/lib/shared/types';
import type { PrismaPromise } from '@prisma/client';

const mockElastic = {
  ping: vi.fn().mockResolvedValue(true),
};

const mockRedis = {
  ping: vi.fn().mockResolvedValue(true),
};

const mockPrisma = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
};

vi.mock('@/lib/cortex/elasticsearch/client', () => ({
  ElasticClient: vi.fn().mockImplementation(() => mockElastic),
}));

vi.mock('@/lib/cortex/redis/client', () => ({
  RedisClient: vi.fn().mockImplementation(() => mockRedis),
}));

const config = {
  elasticsearch: {
    url: 'http://localhost:9200',
  },
  redis: {
    url: 'redis://localhost:6379',
  },
  database: {
    url: 'postgresql://localhost:5432/test',
  },
  environment: 'test' as const,
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as unknown as Logger,
};

vi.mock('@/lib/shared/logger', () => ({
  default: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      service: 'test-service',
      silent: false,
      format: {},
      levels: {},
    })),
  },
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      service: 'test-service',
      silent: false,
      format: {},
      levels: {},
    })),
  },
}));

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRaw: vi.fn().mockImplementation(() => {
      const promise = Promise.resolve([{ '?column?': 1 }]) as PrismaPromise<unknown>;
      Object.defineProperty(promise, Symbol.toStringTag, { value: 'PrismaPromise' });
      return promise;
    }),
  },
}));

describe('SophraClient', () => {
  let client: SophraClient;
  const originalEnv = process.env;

  let mockLogger: Logger;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ELASTICSEARCH_URL: 'http://localhost:9200',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      ELASTICSEARCH_API_KEY: 'test-api-key',
      SOPHRA_REDIS_URL: 'redis://localhost:6379',
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    } as unknown as Logger;

    vi.clearAllMocks();
    client = new SophraClient(config);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a client instance with valid config', () => {
      expect(client).toBeInstanceOf(SophraClient);
    });

    it('should throw error if environment is missing', () => {
      // skipcq: JS-0323
      expect(() => new SophraClient({} as any)).toThrow('Environment is required');
    });

    it('should throw error if ELASTICSEARCH_URL is missing', () => {
      delete process.env.ELASTICSEARCH_URL;
      expect(() => new SophraClient({ environment: 'test' })).toThrow(
        'ELASTICSEARCH_URL environment variable is required'
      );
    });

    it('should throw error if DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      expect(() => new SophraClient({ environment: 'test' })).toThrow(
        'DATABASE_URL environment variable is required'
      );
    });

    it('should throw error if both ES API keys are missing', () => {
      delete process.env.ELASTICSEARCH_API_KEY;
      delete process.env.SOPHRA_ES_API_KEY;
      expect(() => new SophraClient({ environment: 'test' })).toThrow(
        'Either ELASTICSEARCH_API_KEY or SOPHRA_ES_API_KEY is required'
      );
    });
  });

  describe('initialize', () => {
    it('should initialize all services successfully', async () => {
      const mockPing = vi.fn().mockResolvedValue(true);
      (ElasticClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));
      (RedisClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));

      await client.initialize();

      expect(ElasticClient).toHaveBeenCalled();
      expect(RedisClient).toHaveBeenCalled();
      expect(prisma.$connect).toHaveBeenCalled();
      expect(mockPing).toHaveBeenCalled();
    });

    it('should initialize without Redis if SOPHRA_REDIS_URL is not set', async () => {
      delete process.env.SOPHRA_REDIS_URL;
      const mockPing = vi.fn().mockResolvedValue(true);
      (ElasticClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));

      await client.initialize();

      expect(ElasticClient).toHaveBeenCalled();
      expect(RedisClient).not.toHaveBeenCalled();
      expect(prisma.$connect).toHaveBeenCalled();
    });

    it('should handle initialization errors and cleanup', async () => {
      const mockError = new Error('Initialization failed');
      (ElasticClient as jest.Mock).mockImplementation(() => ({
        ping: vi.fn().mockRejectedValue(mockError),
      }));

      await expect(client.initialize()).rejects.toThrow('Initialization failed');
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should disconnect all services successfully', async () => {
      const mockDisconnect = vi.fn().mockResolvedValue(undefined);
      const mockElasticClient = {
        ping: vi.fn().mockResolvedValue(true),
        getClient: vi.fn().mockReturnValue({
          close: vi.fn().mockResolvedValue(undefined)
        })
      };
      (RedisClient as jest.Mock).mockImplementation(() => ({
        ping: vi.fn().mockResolvedValue(true),
        disconnect: mockDisconnect,
      }));
      (ElasticClient as jest.Mock).mockImplementation(() => mockElasticClient);

      const client = new SophraClient(config);
      await client.initialize();
      await client.shutdown();

      expect(mockDisconnect).toHaveBeenCalled();
      expect(mockElasticClient.getClient().close).toHaveBeenCalled();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      const mockError = new Error('Shutdown failed');
      const mockElasticClient = {
        ping: vi.fn().mockResolvedValue(true),
        getClient: vi.fn().mockReturnValue({
          close: vi.fn().mockResolvedValue(undefined)
        })
      };
      (ElasticClient as jest.Mock).mockImplementation(() => mockElasticClient);
      (RedisClient as jest.Mock).mockImplementation(() => ({
        ping: vi.fn().mockResolvedValue(true),
        disconnect: vi.fn().mockResolvedValue(undefined),
      }));
      vi.spyOn(prisma, '$disconnect').mockRejectedValue(mockError);

      const client = new SophraClient(config);
      await client.initialize();
      await expect(client.shutdown()).rejects.toThrow('Shutdown failed');
    });
  });

  describe('healthCheck', () => {
    test('should return health status for all services', async () => {
      const mockPing = vi.fn().mockResolvedValue(true);
      (ElasticClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));
      (RedisClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));
      vi.spyOn(prisma, '$queryRaw').mockImplementation(() => {
        const promise = Promise.resolve([{ '?column?': 1 }]) as PrismaPromise<unknown>;
        Object.defineProperty(promise, Symbol.toStringTag, { value: 'PrismaPromise' });
        return promise;
      });
      
      const client = new SophraClient(config);
      await client.initialize();
      const health = await client.healthCheck();
      
      expect(health).toEqual({
        elasticsearch: true,
        database: true,
        redis: true,
      });
    });

    it('should handle service failures', async () => {
      const mockError = new Error('Service failed');
      const mockElasticClient = {
        ping: vi.fn()
          .mockResolvedValueOnce(true)  // For initialization
          .mockRejectedValueOnce(mockError),  // For health check
        getClient: vi.fn().mockReturnValue({
          close: vi.fn().mockResolvedValue(undefined)
        })
      };
      const mockRedisClient = {
        ping: vi.fn()
          .mockResolvedValueOnce(true)  // For initialization
          .mockRejectedValueOnce(mockError),  // For health check
        disconnect: vi.fn().mockResolvedValue(undefined),
      };
      
      (ElasticClient as jest.Mock).mockImplementation(() => mockElasticClient);
      (RedisClient as jest.Mock).mockImplementation(() => mockRedisClient);
      vi.spyOn(prisma, '$queryRaw').mockRejectedValue(mockError);
      
      const testLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
        service: 'test-service',
        silent: false,
        format: {},
        levels: {},
        level: 'info',
        http: vi.fn(),
        verbose: vi.fn()
      } as unknown as Logger;
      
      const client = new SophraClient({ ...config, logger: testLogger });
      await client.initialize();
      const health = await client.healthCheck();

      expect(health).toEqual({
        elasticsearch: false,
        database: false,
        redis: false,
      });
      expect(testLogger.error).toHaveBeenCalledWith('Elasticsearch health check failed', { error: mockError });
      expect(testLogger.error).toHaveBeenCalledWith('Database health check failed', { error: mockError });
      expect(testLogger.error).toHaveBeenCalledWith('Redis health check failed', { error: mockError });
    });
  });

  describe('getElasticClient', () => {
    it('should return initialized elastic client', async () => {
      const mockClient = {
        ping: vi.fn().mockResolvedValue(true),
        getClient: vi.fn().mockReturnValue({
          close: vi.fn().mockResolvedValue(undefined)
        })
      };
      (ElasticClient as jest.Mock).mockImplementation(() => mockClient);
      
      const client = new SophraClient(config);
      await client.initialize();
      const elasticClient = client.getElasticClient();

      expect(elasticClient).toBeDefined();
      expect(elasticClient).toBe(mockClient);
      expect(mockClient.ping).toHaveBeenCalled();
    });

    it('should throw error if client is not initialized', () => {
      const client = new SophraClient(config);
      
      expect(() => client.getElasticClient()).toThrow('Elasticsearch client not initialized');
    });
  });

  describe('getRedisClient', () => {
    it('should return initialized redis client', async () => {
      const mockPing = vi.fn().mockResolvedValue(true);
      (RedisClient as jest.Mock).mockImplementation(() => ({
        ping: mockPing,
      }));

      await client.initialize();
      const redisClient = client.getRedisClient();

      expect(redisClient).toBeDefined();
    });

    it('should throw error if client is not initialized', () => {
      expect(() => client.getRedisClient()).toThrow('Redis client not initialized');
    });
  });
}); 