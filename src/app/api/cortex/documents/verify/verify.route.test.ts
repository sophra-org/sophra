import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from '@/../vitest.setup';

vi.mock('@/lib/shared/database/client', () => ({
    prisma: mockPrisma
}));

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn().mockResolvedValue({
            elasticsearch: {
                indexExists: vi.fn()
            }
        })
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        error: vi.fn()
    }
}));

vi.mock('next/server', () => ({
    NextRequest: class MockNextRequest {
        private _url: string;
        public searchParams: URLSearchParams;
        
        constructor(url: string) {
            this._url = url;
            const parsedUrl = new URL(url);
            this.searchParams = parsedUrl.searchParams;
        }

        get url() {
            return this._url;
        }

        json() {
            return Promise.resolve({});
        }
    },
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const response = new Response(JSON.stringify(data), {
                ...init,
                headers: {
                    ...init?.headers,
                    'Content-Type': 'application/json',
                }
            });
            return Object.assign(response, {
                cookies: new Map(),
                json: () => Promise.resolve(data)
            });
        }
    }
}));

import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { prisma } from '@/lib/shared/database/client';
import logger from '@/lib/shared/logger';

global.fetch = vi.fn();

describe('Document Verification API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 when index parameter is missing', async () => {
        const request = new NextRequest('http://localhost/api/documents/verify?id=123');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing index or id parameter');
    });

    it('should return 400 when id parameter is missing', async () => {
        const request = new NextRequest('http://localhost/api/documents/verify?index=test-index');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Missing index or id parameter');
    });

    it('should return 404 when index is not found in database', async () => {
        vi.mocked(mockPrisma.index.findUnique).mockResolvedValue(null);

        const request = new NextRequest('http://localhost/api/documents/verify?index=invalid-index&id=123');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Index not found');
    });

    it('should return document verification details when document exists', async () => {
        vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
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
            health: 'green'
        });

        const mockEsService = await serviceManager.getServices();
        vi.mocked(mockEsService.elasticsearch.indexExists).mockResolvedValue(true);

        const mockEsResponse = {
            found: true,
            _source: { title: 'Test Document' }
        };
        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve(mockEsResponse)
        });

        const request = new NextRequest('http://localhost/api/documents/verify?index=test-index-id&id=123');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.indexExists).toBe(true);
        expect(data.data.documentExists).toBe(true);
        expect(data.data.documentData).toEqual({ title: 'Test Document' });
        expect(data.data.index).toBe('test-index');
        expect(data.data.indexId).toBe('test-index-id');
        expect(data.data.id).toBe('123');
        expect(data.meta.timestamp).toBeDefined();
    });

    it('should handle non-existent document gracefully', async () => {
        vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
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
            health: 'green'
        });

        const mockEsService = await serviceManager.getServices();
        vi.mocked(mockEsService.elasticsearch.indexExists).mockResolvedValue(true);

        const mockEsResponse = {
            found: false
        };
        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve(mockEsResponse)
        });

        const request = new NextRequest('http://localhost/api/documents/verify?index=test-index-id&id=non-existent');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.documentExists).toBe(false);
        expect(data.data.documentData).toBeNull();
    });

    it('should handle elasticsearch service errors', async () => {
        vi.mocked(mockPrisma.index.findUnique).mockResolvedValue({
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
            health: 'green'
        });

        global.fetch = vi.fn().mockRejectedValue(new Error('Elasticsearch error'));

        const request = new NextRequest('http://localhost/api/documents/verify?index=test-index-id&id=123');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to verify document');
        expect(logger.error).toHaveBeenCalled();
    });
});
