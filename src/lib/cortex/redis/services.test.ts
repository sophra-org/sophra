import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedisCacheService } from './services';
import type { RedisClient } from './client';
import type { Logger } from '@/lib/shared/types';
import type { DataSyncService } from '@/lib/cortex/core/sync-service';
import type { BaseDocument } from '@/lib/cortex/elasticsearch/types';
import type { SearchResult } from '@/lib/cortex/types/search';
import { MetricsService } from '@/lib/cortex/monitoring/metrics';

interface TestDocument extends BaseDocument {
  title: string;
  content: string;
}

// Mock MetricsService
vi.mock('@/lib/cortex/monitoring/metrics', () => {
  return {
    MetricsService: vi.fn().mockImplementation(() => ({
      recordEngineMetric: vi.fn(),
      recordLatency: vi.fn(),
      incrementError: vi.fn(),
      incrementMetric: vi.fn(),
      updateResourceUsage: vi.fn(),
      updateCacheHitRatio: vi.fn(),
      updateSearchQuality: vi.fn(),
      recordAlert: vi.fn(),
      recordReportDistribution: vi.fn(),
      updateABTestMetrics: vi.fn(),
    }))
  }
});

describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;
  let mockClient: RedisClient;
  let mockLogger: Logger;
  let mockSearchService: DataSyncService;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    mockClient = {
      ping: vi.fn().mockResolvedValue(true),
      set: vi.fn().mockResolvedValue('OK'),
      setEx: vi.fn().mockResolvedValue('OK'),
      get: vi.fn(),
      getEx: vi.fn(),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn(),
      expire: vi.fn(),
      scan: vi.fn(),
      info: vi.fn(),
      getClient: vi.fn().mockReturnValue({
        del: vi.fn().mockResolvedValue(1),
        keys: vi.fn().mockResolvedValue([]),
      }),
    } as unknown as RedisClient;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      service: 'test',
      http: vi.fn(),
      verbose: vi.fn(),
      silent: false,
      format: {},
      levels: {},
      level: 'info',
    } as unknown as Logger;

    mockSearchService = {
      search: vi.fn(),
      index: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      bulk: vi.fn(),
      healthCheck: vi.fn(),
    } as unknown as DataSyncService;

    mockMetrics = new MetricsService({
      logger: mockLogger,
      environment: 'test'
    });

    cacheService = new RedisCacheService({
      client: mockClient,
      logger: mockLogger,
      defaultTTL: 3600,
      searchService: mockSearchService,
      environment: 'test',
      metrics: mockMetrics
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ping', () => {
    it('should return true when Redis is available', async () => {
      const result = await cacheService.ping();
      expect(result).toBe(true);
      expect(mockClient.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is unavailable', async () => {
      mockClient.ping = vi.fn().mockRejectedValue(new Error('Connection failed'));
      const result = await cacheService.ping();
      expect(result).toBe(false);
    });
  });

  describe('set', () => {
    it('should set cache value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 3600;

      await cacheService.set(key, value, ttl);
      expect(mockClient.setEx).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(value)
      );
    });

    it('should handle set errors', async () => {
      mockClient.setEx = vi.fn().mockRejectedValue(new Error('Set failed'));
      await expect(cacheService.set('test-key', 'test-value', 3600)).rejects.toThrow('Set failed');
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockMetrics.incrementMetric).toHaveBeenCalledWith('redis_set_failed', expect.any(Object));
    });
  });

  describe('get', () => {
    it('should get cached value', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      mockClient.getEx = vi.fn().mockResolvedValue(JSON.stringify(value));

      const result = await cacheService.get(key);
      expect(result).toEqual(value);
      expect(mockClient.getEx).toHaveBeenCalledWith(key);
    });

    it('should return default value when key not found', async () => {
      const defaultValue = { default: true };
      mockClient.getEx = vi.fn().mockResolvedValue(null);

      const result = await cacheService.get('non-existent', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('cacheSearchResults', () => {
    it('should cache search results with query hash', async () => {
      const index = 'test-index';
      const queryHash = 'test-query-hash';
      const results: SearchResult<TestDocument> = {
        hits: [
          {
            _id: 'doc1',
            _score: 1.0,
            _source: {
              id: 'doc1',
              title: 'Test Document',
              content: 'Test content',
              abstract: '',
              authors: [],
              source: '',
              tags: [],
              metadata: {},
              processing_status: 'complete',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              embeddings: [],
              evaluationScore: {
                actionability: 0,
                aggregate: 0,
                clarity: 0,
                credibility: 0,
                relevance: 0,
              },
              evaluation_score: {
                actionability: 0,
                aggregate: 0,
                clarity: 0,
                credibility: 0,
                relevance: 0,
              },
              type: 'test'
            }
          }
        ],
        total: 1,
        took: 5,
        maxScore: 1.0
      };

      mockClient.setEx = vi.fn().mockResolvedValue('OK');
      await cacheService.cacheSearchResults(index, queryHash, results);
      expect(mockClient.setEx).toHaveBeenCalled();
    });
  });

  describe('getSearchResults', () => {
    it('should retrieve cached search results', async () => {
      const index = 'test-index';
      const queryHash = 'test-query-hash';
      const cachedResults = {
        hits: [{
          _id: 'doc1',
          _score: 1.0,
          _source: {
            id: 'doc1',
            title: 'Test Document',
            content: 'Test content',
            abstract: '',
            authors: [],
            source: '',
            tags: [],
            metadata: {},
            processing_status: 'complete',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            embeddings: [],
            evaluationScore: {
              actionability: 0,
              aggregate: 0,
              clarity: 0,
              credibility: 0,
              relevance: 0,
            },
            evaluation_score: {
              actionability: 0,
              aggregate: 0,
              clarity: 0,
              credibility: 0,
              relevance: 0,
            },
            type: 'test'
          }
        }],
        total: { value: 1, relation: 'eq' },
        took: 5,
        maxScore: 1.0,
        timestamp: new Date().toISOString(),
      };

      const key = `search:${index}:${queryHash}`;
      mockClient.getEx = vi.fn().mockImplementation(async (k) => {
        if (k === key) {
          return JSON.stringify(cachedResults);
        }
        if (k.startsWith('query:patterns:')) {
          return JSON.stringify({
            frequency: 1,
            lastAccessed: new Date().toISOString(),
            avgLatency: 100,
            hitRate: 0.5,
          });
        }
        return null;
      });

      const results = await cacheService.getSearchResults(index, queryHash);
      expect(results).toBeDefined();
      expect(results).toMatchObject({
        hits: expect.any(Array),
        total: expect.any(Object),
        took: expect.any(Number),
        maxScore: expect.any(Number),
        timestamp: expect.any(String),
      });
    });

    it('should return null for cache miss', async () => {
      mockClient.getEx = vi.fn().mockResolvedValue(null);
      const results = await cacheService.getSearchResults('test-index', 'test-hash');
      expect(results).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('should disconnect Redis client', async () => {
      await cacheService.disconnect();
      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      vi.spyOn(mockClient, 'ping').mockResolvedValueOnce(true);
      const health = await cacheService.healthCheck();
      expect(health).toBe(true);
    });

    it('should return false when Redis is unhealthy', async () => {
      mockClient.ping = vi.fn().mockRejectedValue(new Error('Health check failed'));
      const health = await cacheService.healthCheck();
      expect(health).toBe(false);
    });
  });
});
