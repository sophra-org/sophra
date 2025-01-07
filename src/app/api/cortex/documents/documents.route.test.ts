import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import logger from '@/lib/shared/logger';

// Mock NextResponse.json
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn().mockImplementation((data, options) => {
        const response = new Response(JSON.stringify(data), options);
        response.json = () => Promise.resolve(data);
        return response;
      })
    }
  };
});

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn().mockResolvedValue({
            elasticsearch: {
                indexExists: vi.fn(),
                createIndex: vi.fn()
            },
            sync: {
                upsertDocument: vi.fn()
            }
        })
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        error: vi.fn()
    }
}));

describe('Documents API POST Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle valid document creation with embeddings', async () => {
        const validDocument = {
            index: 'test-index',
            document: {
                title: 'Test Document',
                content: 'Test Content',
                abstract: 'Test Abstract',
                authors: ['Author 1', 'Author 2'],
                tags: ['tag1', 'tag2'],
                source: 'test',
                embeddings: Array(3072).fill(0.1)
            }
        };

        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.indexExists).mockResolvedValue(true);
        vi.mocked(services.sync.upsertDocument).mockResolvedValue({ id: '123' });

        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: JSON.stringify(validDocument),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.id).toBe('123');
        expect(data.data.document.processing_status).toBe('pending');
    });

    it('should handle document with special characters in content', async () => {
        const documentWithSpecialChars = {
            index: 'test-index',
            document: {
                title: 'Test Document',
                content: 'Test\nContent\nWith\nNewlines\nAnd"Quotes"',
                abstract: 'Test Abstract',
                authors: ['Author 1'],
                tags: ['tag1'],
                source: 'test'
            }
        };

        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.indexExists).mockResolvedValue(true);
        vi.mocked(services.sync.upsertDocument).mockResolvedValue({ id: '123' });

        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: JSON.stringify(documentWithSpecialChars),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should create index if it does not exist', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.indexExists).mockResolvedValue(false);
        vi.mocked(services.sync.upsertDocument).mockResolvedValue({ id: '123' });

        const validDocument = {
            index: 'new-index',
            document: {
                title: 'Test Document',
                content: 'Test Content',
                abstract: 'Test Abstract',
                authors: ['Author 1'],
                tags: ['tag1'],
                source: 'test'
            }
        };

        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: JSON.stringify(validDocument),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(services.elasticsearch.createIndex).toHaveBeenCalledWith('new-index', expect.any(Object));
    });

    it('should handle invalid JSON input', async () => {
        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: '{invalid:json}',
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid JSON');
    });

    it('should validate required fields', async () => {
        const invalidDocument = {
            index: 'test-index',
            document: {
                title: 'Test Document'
            }
        };

        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: JSON.stringify(invalidDocument),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Validation failed');
    });

    it('should handle service errors gracefully', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.elasticsearch.indexExists).mockRejectedValue(new Error('Service error'));

        const validDocument = {
            index: 'test-index',
            document: {
                title: 'Test Document',
                content: 'Test Content',
                abstract: 'Test Abstract',
                authors: ['Author 1'],
                tags: ['tag1'],
                source: 'test'
            }
        };

        const request = new NextRequest('http://localhost/api/documents', {
            method: 'POST',
            body: JSON.stringify(validDocument),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(logger.error).toHaveBeenCalled();
    });
});
