import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, GET, DELETE } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import prisma from '@/lib/shared/database/client';
import logger from '@/lib/shared/logger';
import { NextRequest, NextResponse } from 'next/server';

// Setup mocks
vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
    }
}));

vi.mock('@/lib/shared/database/client', () => ({
    default: {
        index: {
            findUnique: vi.fn()
        }
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn()
    }
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('next/server', () => ({
    NextRequest: class MockNextRequest {
        private body: string;
        url: string;
        nextUrl: URL;
        constructor(url: string, init?: { method: string; body?: string }) {
            this.url = url;
            this.nextUrl = new URL(url);
            this.body = init?.body || '';
        }
        async text() {
            return this.body;
        }
        async json() {
            return JSON.parse(this.body);
        }
    },
    NextResponse: {
        json: vi.fn().mockImplementation((data, init) => ({
            status: init?.status || 200,
            ok: init?.status ? init.status >= 200 && init.status < 300 : true,
            headers: new Headers(),
            json: async () => data
        }))
    }
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Document API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.index.findUnique).mockResolvedValue({
            name: 'test-index',
            id: '',
            status: '',
            settings: null,
            mappings: null,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
            doc_count: 0,
            size_bytes: 0,
            health: ''
        });
    });

    describe('PUT /api/cortex/documents/[id]', () => {
        it('should successfully update a document', async () => {
            const documentId = '123';
            const updateData = {
                title: 'Updated Title',
                content: 'Updated Content'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ result: 'updated' })
            });

            const request = new NextRequest('http://localhost/api/cortex/documents/123?index=test-index', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            const response = await PUT(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.updated).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-index/_update/'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"doc":{"title":"Updated Title","content":"Updated Content"}')
                })
            );
        });

        it('should handle invalid update fields', async () => {
            const documentId = '123';
            const invalidData = {
                title: 123,
                content: true,
                tags: 'not-an-array'
            };

            const request = new NextRequest('http://localhost/api/cortex/documents/123?index=test-index', {
                method: 'PUT',
                body: JSON.stringify(invalidData)
            });

            const response = await PUT(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid update data');
            expect(data.details).toBeDefined();
        });
    });

    describe('GET /api/cortex/documents/[id]', () => {
        it('should retrieve a document successfully', async () => {
            const documentId = '123';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    _source: {
                        title: 'Test Document',
                        content: 'Test Content'
                    }
                })
            });

            const request = new NextRequest(`http://localhost/api/cortex/documents/${documentId}?index=test-index`);
            const response = await GET(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.title).toBe('Test Document');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-index/_doc/'),
                expect.any(Object)
            );
        });

        it('should handle non-existent index', async () => {
            const documentId = '123';
            vi.mocked(prisma.index.findUnique).mockResolvedValue(null);

            const request = new NextRequest(`http://localhost/api/cortex/documents/${documentId}?index=test-index`);
            const response = await GET(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Index not found');
        });
    });

    describe('DELETE /api/cortex/documents/[id]', () => {
        it('should delete a document successfully', async () => {
            const documentId = '123';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ result: 'deleted' })
            });

            const request = new NextRequest(`http://localhost/api/cortex/documents/${documentId}?index=test-index`, {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-index/_doc/'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });

        it('should handle already deleted document gracefully', async () => {
            const documentId = '123';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ result: 'not_found' })
            });

            const request = new NextRequest(`http://localhost/api/cortex/documents/${documentId}?index=test-index`, {
                method: 'DELETE'
            });
            const response = await DELETE(request, { params: { id: documentId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/test-index/_doc/'),
                expect.objectContaining({
                    method: 'DELETE'
                })
            );
        });
    });
});
