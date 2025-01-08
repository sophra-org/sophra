import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
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
    index: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Document Verify API Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
    process.env.SOPHRA_ES_API_KEY = 'test-key';
  });

  const mockServices = {
    elasticsearch: {
      indexExists: vi.fn(),
    },
  };

  const mockIndex = {
    id: 'test-index-id',
    name: 'test-index',
    status: 'active',
    settings: {},
    mappings: {},
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    doc_count: 0,
    size_bytes: 0,
    health: 'green',
  };

  beforeEach(() => {
    vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as any);
    vi.mocked(prisma.index.findUnique).mockResolvedValue(mockIndex);
    vi.mocked(mockServices.elasticsearch.indexExists).mockResolvedValue(true);
  });

  describe('Parameter Validation', () => {
    it('should require index parameter', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing index or id parameter');
    });

    it('should require id parameter', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing index or id parameter');
    });

    it('should validate both parameters are present', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: { title: 'Test' } }),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Index Verification', () => {
    it('should verify index exists in Prisma', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: { title: 'Test' } }),
      });

      await GET(request);

      expect(prisma.index.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-index-id' },
      });
    });

    it('should handle non-existent index in Prisma', async () => {
      vi.mocked(prisma.index.findUnique).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Index not found');
    });

    it('should check index existence in Elasticsearch', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: { title: 'Test' } }),
      });

      await GET(request);

      expect(mockServices.elasticsearch.indexExists).toHaveBeenCalledWith(
        'test-index'
      );
    });

    it('should handle non-existent index in Elasticsearch', async () => {
      vi.mocked(mockServices.elasticsearch.indexExists).mockResolvedValue(false);

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: false }),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.indexExists).toBe(false);
    });
  });

  describe('Document Verification', () => {
    it('should verify document exists', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const mockDocument = { title: 'Test Document', content: 'Test Content' };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: mockDocument }),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.documentExists).toBe(true);
      expect(data.data.documentData).toEqual(mockDocument);
    });

    it('should handle non-existent document', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: false }),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.documentExists).toBe(false);
      expect(data.data.documentData).toBeNull();
    });

    it('should use correct Elasticsearch URL and authentication', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: {} }),
      });

      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9200/test-index/_doc/test-id',
        expect.objectContaining({
          headers: {
            Authorization: 'ApiKey test-key',
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Prisma errors', async () => {
      vi.mocked(prisma.index.findUnique).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to verify document');
      expect(logger.error).toHaveBeenCalledWith(
        'Document verification failed',
        expect.any(Object)
      );
    });

    it('should handle Elasticsearch errors', async () => {
      vi.mocked(mockServices.elasticsearch.indexExists).mockRejectedValue(
        new Error('Elasticsearch error')
      );

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to verify document');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to verify document');
    });
  });

  describe('Response Formatting', () => {
    it('should include all required fields in success response', async () => {
      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ found: true, _source: { title: 'Test' } }),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          indexExists: true,
          documentExists: true,
          documentData: { title: 'Test' },
          index: 'test-index',
          indexId: 'test-index-id',
          id: 'test-id',
        },
        meta: {
          timestamp: expect.any(String),
        },
      });
    });

    it('should format error responses consistently', async () => {
      vi.mocked(prisma.index.findUnique).mockRejectedValue(
        new Error('Test error')
      );

      const request = new NextRequest(
        'http://localhost/api/documents/verify?index=test-index-id&id=test-id'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        success: false,
        error: 'Failed to verify document',
      });
    });
  });
});
