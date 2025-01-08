import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import logger from '@/lib/shared/logger';

// Mock dependencies
vi.mock('@/lib/cortex/utils/service-manager', () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Documents API Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Only mock the services we actually use in the route
  const mockServices = {
    elasticsearch: {
      indexExists: vi.fn(),
      createIndex: vi.fn(),
      client: {},
      logger: {},
      requestQueue: {
        add: vi.fn(),
      },
      upsertDocument: vi.fn(),
    },
    sync: {
      upsertDocument: vi.fn(),
    },
    // Provide null for optional services
    redis: null,
    postgres: null,
    vectorization: null,
    analytics: null,
    metrics: null,
    abTesting: null,
    feedback: null,
    sessions: null,
    observe: null,
    learning: null,
    engine: {
      instance: null,
      testService: vi.fn(),
    },
    documents: null,
    health: null,
  };

  const validDocument = {
    index: 'test-index',
    document: {
      title: 'Test Document',
      content: 'This is a test document content.',
      abstract: 'Test abstract',
      authors: ['Author 1', 'Author 2'],
      tags: ['test', 'document'],
      source: 'test-source',
      metadata: {
        field1: 'value1',
        field2: 'value2',
      },
    },
  };

  beforeEach(() => {
    vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as any);
    vi.mocked(mockServices.elasticsearch.indexExists).mockResolvedValue(true);
    vi.mocked(mockServices.sync.upsertDocument).mockResolvedValue({
      id: 'test-id',
      index: 'test-index',
    });
  });

  describe('Input Validation', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: 'invalid json{',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON');
      expect(data.context).toBeDefined();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          document: {
            // Missing required fields
            title: 'Test Document',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details.errors).toContainEqual(
        expect.objectContaining({
          path: expect.any(String),
          message: expect.stringContaining('Required'),
        })
      );
    });

    it('should handle special characters in content', async () => {
      const documentWithSpecialChars = {
        ...validDocument,
        document: {
          ...validDocument.document,
          content: 'Line 1\nLine 2\r\nLine 3\rLine 4',
        },
      };

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(documentWithSpecialChars),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.document.content).toBe(documentWithSpecialChars.document.content);
    });

    it('should sanitize and handle single quoted arrays', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...validDocument,
          document: {
            ...validDocument.document,
            tags: "'tag1', 'tag2'",
            authors: "'Author 1', 'Author 2'",
          },
        }).replace(/"/g, "'"),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid JSON');
    });
  });

  describe('Index Management', () => {
    it('should create index if it does not exist', async () => {
      vi.mocked(mockServices.elasticsearch.indexExists).mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockServices.elasticsearch.createIndex).toHaveBeenCalledWith(
        'test-index',
        expect.objectContaining({
          body: expect.objectContaining({
            mappings: expect.any(Object),
            settings: expect.any(Object),
          }),
        })
      );
    });

    it('should handle index creation errors', async () => {
      vi.mocked(mockServices.elasticsearch.indexExists).mockResolvedValue(false);
      vi.mocked(mockServices.elasticsearch.createIndex).mockRejectedValue(
        new Error('Failed to create index')
      );

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create document');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create document',
        expect.any(Object)
      );
    });

    it('should handle existing index gracefully', async () => {
      vi.mocked(mockServices.elasticsearch.createIndex).mockRejectedValue(
        new Error('index already exists')
      );

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Document Processing', () => {
    it('should process document successfully', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          index: validDocument.index,
          created: true,
          document: expect.objectContaining({
            ...validDocument.document,
            id: expect.any(String),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            processing_status: 'pending',
          }),
        })
      );
    });

    it('should handle document processing errors', async () => {
      vi.mocked(mockServices.sync.upsertDocument).mockRejectedValue(
        new Error('Failed to process document')
      );

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create document');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create document',
        expect.any(Object)
      );
    });

    it('should include queue stats in response', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.meta.queueStats).toBeDefined();
      expect(data.meta.queueStats).toEqual(
        expect.objectContaining({
          documentQueue: expect.any(Object),
          indexQueue: expect.any(Object),
        })
      );
    });

    it('should handle optional embeddings field', async () => {
      const documentWithEmbeddings = {
        ...validDocument,
        document: {
          ...validDocument.document,
          embeddings: Array(3072).fill(0.1),
        },
      };

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(documentWithEmbeddings),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.document.embeddings).toHaveLength(3072);
    });
  });

  describe('Error Classification', () => {
    it('should classify JSON parse errors', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: '{"invalid": json}',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON');
      expect(data.context).toEqual(
        expect.objectContaining({
          expectedFormat: expect.any(Object),
        })
      );
    });

    it('should classify mapping errors', async () => {
      vi.mocked(mockServices.sync.upsertDocument).mockRejectedValue(
        new Error('mapping error: field [invalid_field] not found')
      );

      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify(validDocument),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create document');
      expect(data.details).toContain('mapping error');
    });

    it('should include helpful error context', async () => {
      const request = new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          document: {
            // Invalid document structure
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.help).toBeDefined();
      expect(data.help.example).toBeDefined();
    });
  });
});
