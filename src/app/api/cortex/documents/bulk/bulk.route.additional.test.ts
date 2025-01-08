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
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Bulk Documents API Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSyncService = {
    upsertDocument: vi.fn(),
  };

  const mockServices = {
    sync: {
      getSyncService: vi.fn().mockResolvedValue(mockSyncService),
    },
  };

  const createValidDocument = (index: number) => ({
    title: `Test Document ${index}`,
    content: `Content for document ${index}`,
    abstract: `Abstract for document ${index}`,
    authors: [`Author ${index}`],
    tags: [`tag${index}`],
    source: 'test-source',
    metadata: {
      field1: `value${index}`,
    },
  });

  beforeEach(() => {
    vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as any);
    vi.mocked(mockSyncService.upsertDocument).mockImplementation(async ({ id }) => ({
      id,
      index: 'test-index',
    }));
  });

  describe('Input Validation', () => {
    it('should validate request schema', async () => {
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          documents: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request parameters');
      expect(data.details).toBeDefined();
    });

    it('should validate document schema', async () => {
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents: [
            {
              // Missing required fields
              title: 'Test Document',
            },
          ],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details).toBeDefined();
    });

    it('should handle optional tableName', async () => {
      const documents = [createValidDocument(1)];
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSyncService.upsertDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'test-index', // Should default to index
        })
      );
    });

    it('should use provided tableName when available', async () => {
      const documents = [createValidDocument(1)];
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          tableName: 'custom-table',
          documents,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSyncService.upsertDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'custom-table',
        })
      );
    });
  });

  describe('Batch Processing', () => {
    it('should process documents in batches', async () => {
      const documents = Array(600)
        .fill(null)
        .map((_, i) => createValidDocument(i));

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.processed).toBe(600);
      expect(data.data.total).toBe(600);
      expect(logger.info).toHaveBeenCalledWith(
        'Processed batch 1',
        expect.objectContaining({
          total: 600,
          processed: 500,
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Processed batch 2',
        expect.objectContaining({
          total: 600,
          processed: 600,
        })
      );
    });

    it('should generate unique IDs for each document', async () => {
      const documents = Array(3)
        .fill(null)
        .map((_, i) => createValidDocument(i));

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      const ids = data.data.documents.map((doc: { id: string }) => doc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(documents.length);
    });

    it('should add timestamps to documents', async () => {
      const documents = [createValidDocument(1)];

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents,
        }),
      });

      await POST(request);

      expect(mockSyncService.upsertDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          document: expect.objectContaining({
            created_at: expect.any(String),
            updated_at: expect.any(String),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors', async () => {
      vi.mocked(serviceManager.getServices).mockRejectedValue(
        new Error('Service initialization failed')
      );

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents: [createValidDocument(1)],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Bulk ingestion failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Bulk document ingestion failed',
        expect.any(Object)
      );
    });

    it('should handle document processing errors', async () => {
      vi.mocked(mockSyncService.upsertDocument).mockRejectedValue(
        new Error('Document processing failed')
      );

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents: [createValidDocument(1)],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Bulk ingestion failed');
      expect(data.details).toBe('Document processing failed');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Bulk ingestion failed');
    });
  });

  describe('Response Formatting', () => {
    it('should format successful response', async () => {
      const documents = Array(3)
        .fill(null)
        .map((_, i) => createValidDocument(i));

      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          processed: 3,
          total: 3,
          documents: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should handle empty document array', async () => {
      const request = new NextRequest('http://localhost/api/documents/bulk', {
        method: 'POST',
        body: JSON.stringify({
          index: 'test-index',
          documents: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        processed: 0,
        total: 0,
        documents: [],
      });
    });
  });
});
