import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/shared/logger';
import { mockPrisma } from '~/vitest.setup';
import { Services } from '@/lib/cortex/types/services';
import { PrismaClient } from '@prisma/client';

// Setup mocks
vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('@/lib/shared/database/client', () => ({
    default: {
        index: {
            findUnique: vi.fn()
        }
    }
}));

vi.mock('next/server', () => ({
    NextRequest: class MockNextRequest {
        url: string;
        nextUrl: URL;
        body: string | null;

        constructor(url: string, init?: RequestInit) {
            this.url = url;
            this.nextUrl = new URL(url);
            this.body = init?.body as string || null;
        }

        async json() {
            return this.body ? JSON.parse(this.body) : null;
        }

        async text() {
            return this.body || '';
        }
    },
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const response = new Response(JSON.stringify(data), init);
            Object.defineProperty(response, 'data', {
                value: data,
                writable: false,
            });
            return response;
        }
    }
}));

global.fetch = vi.fn();

describe('Document vectorization endpoints', () => {
    const mockIndex = {
        id: 'test-index',
        name: 'test-index-name',
        status: 'active',
        settings: {},
        mappings: {},
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        doc_count: 0,
        size_bytes: 0,
        health: 'green'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetch).mockClear();
        const prismaClient = mockPrisma as unknown as PrismaClient;
        vi.mocked(prismaClient.index.findUnique).mockReset();
    });

    describe('GET /api/documents/[id]/vectorize', () => {
        it('should return 400 when indexId is missing', async () => {
            const req = new NextRequest('http://localhost/api/documents/123/vectorize');
            const response = await GET(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data).toEqual({
                success: false,
                error: 'Missing indexId parameter'
            });
        });

        it('should return 404 when index is not found', async () => {
            const prismaClient = mockPrisma as unknown as PrismaClient;
            vi.mocked(prismaClient.index.findUnique).mockResolvedValue(null);
            
            const req = new NextRequest('http://localhost/api/documents/123/vectorize?indexId=test-index');
            const response = await GET(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data).toEqual({
                success: false,
                error: 'Index not found'
            });
        });

        it('should handle successful vectorization', async () => {
            const prismaClient = mockPrisma as unknown as PrismaClient;
            vi.mocked(prismaClient.index.findUnique).mockResolvedValue(mockIndex);
            
            const mockEmbeddings = new Array(3072).fill(0.1);
            
            vi.mocked(fetch).mockImplementation((url) => {
                if (url.toString().includes('_doc')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            found: true,
                            _source: {
                                content: 'test content',
                                title: 'test title'
                            }
                        })
                    } as unknown as Response);
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ result: 'updated' })
                } as unknown as Response);
            });

            const mockServices = {
                sync: {
                    vectorizeDocument: vi.fn().mockResolvedValue({
                        embeddings: mockEmbeddings
                    })
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const req = new NextRequest('http://localhost/api/documents/123/vectorize?indexId=test-index');
            const response = await GET(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                success: true,
                data: {
                    id: '123',
                    index: 'test-index-name',
                    vectorized: true,
                    embeddingsLength: 3072
                }
            });
        });
    });

    describe('PUT /api/documents/[id]/vectorize', () => {
        it('should handle missing required parameters', async () => {
            const req = new NextRequest('http://localhost/api/documents/123/vectorize', {
                method: 'PUT',
                body: JSON.stringify({ title: 'test' })
            });
            const response = await PUT(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Missing required parameters');
        });

        it('should handle successful document update', async () => {
            const prismaClient = mockPrisma as unknown as PrismaClient;
            vi.mocked(prismaClient.index.findUnique).mockResolvedValue(mockIndex);
            
            vi.mocked(fetch).mockImplementation(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ result: 'updated' })
                } as Response)
            );

            const updateData = {
                title: 'Updated Title',
                content: 'Updated Content',
                tags: ['tag1', 'tag2']
            };

            const req = new NextRequest(
                'http://localhost/api/documents/123/vectorize?index=test-index',
                {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                }
            );

            const response = await PUT(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                success: true,
                data: {
                    id: '123',
                    index: 'test-index-name',
                    indexId: 'test-index',
                    updated: true,
                    updatedFields: ['title', 'content', 'tags']
                },
                meta: expect.any(Object)
            });
        });

        it('should handle invalid JSON input', async () => {
            const prismaClient = mockPrisma as unknown as PrismaClient;
            vi.mocked(prismaClient.index.findUnique).mockResolvedValue(mockIndex);
            
            const req = new NextRequest(
                'http://localhost/api/documents/123/vectorize?index=test-index',
                {
                    method: 'PUT',
                    body: 'invalid json{'
                }
            );

            const response = await PUT(req, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid JSON');
        });
    });
});
