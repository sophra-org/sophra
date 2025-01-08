import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { prisma } from '@/lib/shared/database/client';
import logger from '@/lib/shared/logger';

// Mock dependencies
vi.mock('@/lib/cortex/utils/service-manager', () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    searchEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Search API Additional Tests', () => {
  const mockElasticsearchService = {
    search: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(serviceManager.getServices).mockResolvedValue({
      elasticsearch: mockElasticsearchService,
    } as any);

    vi.mocked(prisma.searchEvent.create).mockResolvedValue({
      id: 'test-search-event-id',
    } as any);

    mockElasticsearchService.search.mockResolvedValue({
      hits: {
        hits: [],
        total: { value: 0 },
      },
      took: 5,
    });
  });

  describe('Request Validation', () => {
    it('should validate text search request', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test query',
            fields: ['title', 'content'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate vector search request', async () => {
      const vector = Array(3072).fill(0.1);
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'vector',
          vectorQuery: {
            vector,
            field: 'embeddings',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate hybrid search request', async () => {
      const vector = Array(3072).fill(0.1);
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'hybrid',
          textQuery: {
            query: 'test query',
            fields: ['title', 'content'],
          },
          vectorQuery: {
            vector,
            field: 'embeddings',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid vector dimensions', async () => {
      const vector = Array(100).fill(0.1); // Wrong dimensions
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'vector',
          vectorQuery: {
            vector,
            field: 'embeddings',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.details).toContain('Vector must have exactly 3072 dimensions');
    });

    it('should handle missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          searchType: 'text', // Missing index
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Query Building', () => {
    it('should build correct text search query', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test query',
            fields: ['title', 'content'],
            operator: 'AND',
            fuzziness: 'AUTO',
          },
        }),
      });

      await POST(request);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        'test-index',
        expect.objectContaining({
          query: {
            multi_match: {
              query: 'test query',
              fields: ['title', 'content'],
              operator: 'AND',
              fuzziness: 'AUTO',
            },
          },
        })
      );
    });

    it('should build correct vector search query', async () => {
      const vector = Array(3072).fill(0.1);
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'vector',
          vectorQuery: {
            vector,
            field: 'embeddings',
            minScore: 0.8,
          },
        }),
      });

      await POST(request);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        'test-index',
        expect.objectContaining({
          query: {
            script_score: {
              query: { exists: { field: 'embeddings' } },
              script: {
                source: expect.stringContaining('cosineSimilarity'),
                params: { query_vector: vector },
              },
              min_score: 0.8,
            },
          },
        })
      );
    });

    it('should build correct hybrid search query', async () => {
      const vector = Array(3072).fill(0.1);
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'hybrid',
          textQuery: {
            query: 'test query',
            fields: ['title', 'content'],
          },
          vectorQuery: {
            vector,
            field: 'embeddings',
          },
        }),
      });

      await POST(request);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        'test-index',
        expect.objectContaining({
          query: {
            bool: {
              should: [
                expect.objectContaining({ multi_match: expect.any(Object) }),
                expect.objectContaining({ script_score: expect.any(Object) }),
              ],
            },
          },
        })
      );
    });

    it('should handle faceted search', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
          facets: {
            fields: ['category', 'author'],
            size: 5,
          },
        }),
      });

      await POST(request);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        'test-index',
        expect.objectContaining({
          aggregations: {
            category: {
              terms: {
                field: 'category.keyword',
                size: 5,
              },
            },
            author: {
              terms: {
                field: 'author.keyword',
                size: 5,
              },
            },
          },
        })
      );
    });
  });

  describe('Search Event Creation', () => {
    it('should create search event with existing session', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          sessionId: 'existing-session-id',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      await POST(request);

      expect(prisma.searchEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            session: {
              connect: {
                id: 'existing-session-id',
              },
            },
          }),
        })
      );
    });

    it('should create new session if sessionId not provided', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      await POST(request);

      expect(prisma.searchEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            session: {
              create: expect.objectContaining({
                userId: null,
                metadata: {},
              }),
            },
          }),
        })
      );
    });

    it('should track search results', async () => {
      mockElasticsearchService.search.mockResolvedValueOnce({
        hits: {
          hits: [
            { _id: 'doc1' },
            { _id: 'doc2' },
          ],
          total: { value: 2 },
        },
        took: 5,
      });

      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      await POST(request);

      expect(prisma.searchEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalHits: 2,
            took: 5,
            resultIds: JSON.stringify(['doc1', 'doc2']),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle elasticsearch service errors', async () => {
      mockElasticsearchService.search.mockRejectedValueOnce(
        new Error('Elasticsearch error')
      );

      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Search failed');
      expect(data.details).toBe('Elasticsearch error');
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.searchEvent.create).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          searchType: 'text',
          textQuery: {
            query: 'test',
            fields: ['title'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Search failed',
        expect.objectContaining({
          error: expect.any(Error),
        })
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/search', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
