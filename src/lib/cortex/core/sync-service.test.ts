import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataSyncService } from './sync-service';
import type { Logger } from '@/lib/shared/types';
import { prisma } from '@/lib/shared/database/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import type { ElasticsearchService } from '@/lib/cortex/elasticsearch/services';
import type { RedisCacheService } from '@/lib/cortex/redis/services';
import type { VectorizationService } from '@/lib/cortex/services/vectorization';

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    document: {
      delete: vi.fn(),
    },
  },
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    document: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    documents: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  })),
}));

// Mock search response
const mockSearchResponse = {
  hits: {
    hits: [
      {
        _id: '123',
        _score: 1,
        _source: {
          id: '123',
          title: 'Test Document',
          content: 'Test Content',
          abstract: '',
          authors: [],
          source: '',
          tags: [],
          type: '',
          metadata: {},
          embeddings: [],
          processing_status: 'pending',
          evaluation_score: {
            relevance: 0,
            clarity: 0,
            actionability: 0,
            credibility: 0,
            aggregate: 0,
          },
          evaluationScore: {
            relevance: 0,
            clarity: 0,
            actionability: 0,
            credibility: 0,
            aggregate: 0,
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      },
    ],
    total: {
      value: 1,
      relation: 'eq',
    },
  },
  took: 1,
  aggregations: undefined,
  facets: undefined,
};

describe('DataSyncService', () => {
  let syncService: DataSyncService;
  let mockPrisma: any;
  let mockElastic: any;
  let mockRedis: any;
  let mockLogger: any;
  let mockEmbeddingService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      document: {
        upsert: vi.fn(),
        delete: vi.fn(),
      },
      documents: {
        upsert: vi.fn(),
        delete: vi.fn(),
      },
    };
    mockElastic = {
      indexExists: vi.fn(),
      createIndex: vi.fn(),
      upsertDocument: vi.fn(),
      search: vi.fn(),
      delete: vi.fn(),
      deleteDocument: vi.fn(),
    };
    mockRedis = {
      set: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    mockEmbeddingService = {
      vectorize: vi.fn(),
      processDocument: vi.fn(),
    };

    syncService = new DataSyncService({
      logger: mockLogger,
      elasticsearch: mockElastic,
      redis: mockRedis,
      embeddingService: mockEmbeddingService,
    });
  });

  describe('constructor', () => {
    it('should initialize with default searchCacheTTL if not provided', () => {
      const service = new DataSyncService({
        logger: mockLogger,
        elasticsearch: mockElastic,
        redis: mockRedis,
        embeddingService: mockEmbeddingService,
      });
      
      expect(service).toBeDefined();
    });

    it('should use provided searchCacheTTL', () => {
      const service = new DataSyncService({
        logger: mockLogger,
        elasticsearch: mockElastic,
        redis: mockRedis,
        searchCacheTTL: 600,
        embeddingService: mockEmbeddingService,
      });
      
      expect(service).toBeDefined();
    });
  });

  describe('upsertDocument', () => {
    it('should create index if it does not exist', async () => {
      mockElastic.indexExists.mockResolvedValue(false);
      mockElastic.createIndex.mockResolvedValue(undefined);
      mockElastic.upsertDocument.mockResolvedValue({
        id: '123',
        version: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
      mockRedis.set.mockResolvedValue(undefined);

      await syncService.upsertDocument({
        index: 'test-index',
        id: '123',
        document: mockSearchResponse.hits.hits[0]._source,
        tableName: 'documents',
      });

      expect(mockElastic.indexExists).toHaveBeenCalledWith('test-index');
      expect(mockElastic.createIndex).toHaveBeenCalled();
    });

    it('should store document in Elasticsearch, Postgres, and Redis', async () => {
      mockElastic.indexExists.mockResolvedValue(true);
      mockElastic.upsertDocument.mockResolvedValue({
        id: '123',
        version: 1,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      });
      mockRedis.set.mockResolvedValue(undefined);

      const result = await syncService.upsertDocument({
        index: 'test-index',
        id: '123',
        document: mockSearchResponse.hits.hits[0]._source,
        tableName: 'documents',
      });

      expect(mockElastic.upsertDocument).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
      expect(result).toHaveProperty('id', '123');
      expect(result).toHaveProperty('version', 1);
    });

    it('should handle errors during document upsert', async () => {
      const mockError = new Error('Failed to upsert');
      mockElastic.indexExists.mockRejectedValue(mockError);

      await expect(
        syncService.upsertDocument({
          index: 'test-index',
          id: '123',
          document: mockSearchResponse.hits.hits[0]._source,
          tableName: 'documents',
        })
      ).rejects.toThrow('Failed to upsert');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to upsert document', {
        index: 'test-index',
        id: '123',
        error: mockError,
      });
    });

    it('should handle Redis cache failure gracefully', async () => {
      // Setup successful ES and Prisma responses
      mockElastic.indexExists.mockResolvedValue(true);
      mockElastic.upsertDocument.mockResolvedValue({
        id: '123',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        version: 1,
      });

      // Simulate Redis failure
      const redisError = new Error('Redis connection failed');
      mockRedis.set.mockRejectedValueOnce(redisError);

      // Execute test
      const result = await syncService.upsertDocument({
        index: 'documents',
        id: '123',
        document: {
          id: '123',
          title: 'Test Document',
          content: 'Test Content',
          abstract: '',
          authors: [],
          source: '',
          tags: [],
          type: '',
          metadata: {},
          embeddings: [],
          processing_status: 'pending',
          evaluation_score: {
            relevance: 0,
            clarity: 0,
            actionability: 0,
            credibility: 0,
            aggregate: 0,
          },
          evaluationScore: {
            relevance: 0,
            clarity: 0,
            actionability: 0,
            credibility: 0,
            aggregate: 0,
          },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        tableName: 'document',
      });

      // Verify the document was still processed despite Redis failure
      expect(result).toBeDefined();
      expect(result).toEqual({
        id: '123',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: expect.any(Date),
        version: 1,
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Redis cache failure during document upsert',
        expect.objectContaining({
          error: redisError,
          id: '123',
          index: 'documents',
        })
      );
    });
  });

  describe('search', () => {
    it('should return cached results if available', async () => {
      const mockSearchResponse = JSON.stringify({
        hits: {
          hits: [
            {
              _id: '123',
              _score: 1,
              _source: {
                title: 'Test Document'
              }
            }
          ],
          total: {
            value: 1,
            relation: 'eq'
          }
        }
      });
      mockRedis.get.mockResolvedValue(mockSearchResponse);

      const result = await syncService.search({
        index: 'test-index',
        query: { match_all: {} },
      });

      expect(result).toEqual(JSON.parse(mockSearchResponse));
    });

    it('should fetch from Elasticsearch if cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const expectedResponse = {
        hits: {
          hits: [{
            _id: '123',
            _score: 1,
            _source: {
              id: '123',
              title: 'Test Document',
              content: 'Test Content',
              abstract: '',
              authors: [],
              source: '',
              tags: [],
              type: '',
              metadata: {},
              embeddings: [],
              processing_status: 'pending',
              evaluation_score: {
                relevance: 0,
                clarity: 0,
                actionability: 0,
                credibility: 0,
                aggregate: 0,
              },
              evaluationScore: {
                relevance: 0,
                clarity: 0,
                actionability: 0,
                credibility: 0,
                aggregate: 0,
              },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }
          }],
          total: {
            value: 1,
            relation: 'eq'
          },
          max_score: 1
        },
        took: 1,
      };
      mockElastic.search.mockResolvedValue(expectedResponse);
      mockRedis.set.mockResolvedValue(undefined);

      const result = await syncService.search({
        index: 'test-index',
        query: { match_all: {} },
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle search errors', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockElastic.search.mockRejectedValue(new Error('Search failed'));

      await expect(
        syncService.search({
          index: 'test-index',
          query: { match_all: {} },
        })
      ).rejects.toThrow('Search failed');
    });
  });

  describe('deleteDocument', () => {
    beforeEach(() => {
      // Reset mocks with proper implementations
      vi.mock('@/lib/shared/database/client', () => ({
        prisma: {
          document: {
            delete: vi.fn().mockResolvedValue({
              id: '123',
              data: { title: 'Test Document' },
              created_at: new Date('2024-01-01T00:00:00Z'),
              updated_at: new Date('2024-01-01T00:00:00Z'),
            }),
          },
        },
      }));

      mockElastic = {
        deleteDocument: vi.fn().mockResolvedValue({
          result: 'deleted',
        }),
      };
      mockRedis = {
        del: vi.fn().mockResolvedValue(1),
      };
      mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      };

      syncService = new DataSyncService({
        logger: mockLogger,
        elasticsearch: mockElastic,
        redis: mockRedis,
        embeddingService: mockEmbeddingService,
      });
    });

    it('should delete document from all stores', async () => {
      // Mock successful deletion
      const mockDeleteResult = {
        id: '123',
        data: { title: 'Test Document' },
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      };
      vi.spyOn(prisma.document, 'delete').mockResolvedValueOnce(mockDeleteResult);

      await syncService.deleteDocument({
        id: '123',
        index: 'documents',
        tableName: 'document',
      });

      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(mockElastic.deleteDocument).toHaveBeenCalledWith(
        'documents',
        '123'
      );
      expect(mockRedis.del).toHaveBeenCalledWith('doc:documents:123');
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      vi.spyOn(prisma.document, 'delete').mockRejectedValueOnce(error);

      await expect(
        syncService.deleteDocument({
          id: '123',
          index: 'documents',
          tableName: 'document',
        })
      ).rejects.toThrow('Delete failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete from database',
        expect.objectContaining({
          error,
          id: '123',
          tableName: 'document',
        })
      );
    });
  });
});
