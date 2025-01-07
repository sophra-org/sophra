import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/shared/logger';
import { Services } from '@/lib/cortex/types/services';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('crypto', () => ({
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
}));

vi.mock('next/server', () => ({
    NextRequest: class {
        private url: URL;
        public readonly nextUrl: URL;
        public readonly headers: Headers;
        private _body: any;

        constructor(input: string | URL, init?: RequestInit) {
            this.url = new URL(input);
            this.nextUrl = new URL(input);
            this.headers = new Headers(init?.headers);
            this._body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
        }

        get searchParams() {
            return this.nextUrl.searchParams;
        }

        async json() {
            return Promise.resolve(this._body);
        }
    },
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const headers = new Headers(init?.headers);
            const response = new Response(JSON.stringify(data), {
                ...init,
                headers
            });
            
            return {
                ...response,
                json: () => Promise.resolve(data),
                status: init?.status || 200,
                headers,
                ok: true,
                type: 'basic'
            };
        },
    },
}));

describe('POST /api/cortex/documents/bulk', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully process bulk documents with default tableName', async () => {
        const mockSyncService = {
            upsertDocument: vi.fn().mockResolvedValue({ id: '123' })
        };
        const mockServices = {
            sync: {
                getSyncService: vi.fn().mockResolvedValue(mockSyncService)
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const documents = [{
            title: 'Test Doc',
            content: 'Test Content',
            abstract: 'Test Abstract',
            authors: ['Author 1'],
            tags: ['tag1'],
            source: 'test-source'
        }];

        const req = new NextRequest('http://localhost/api/documents/bulk', {
            method: 'POST',
            body: JSON.stringify({
                index: 'test-index',
                documents
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(mockSyncService.upsertDocument).toHaveBeenCalledWith({
            index: 'test-index',
            id: expect.any(String),
            document: expect.objectContaining({
                ...documents[0],
                id: expect.any(String),
                created_at: expect.any(String),
                updated_at: expect.any(String)
            }),
            tableName: 'test-index'
        });
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(1);
    });

    it('should handle batch processing for large document sets', async () => {
        const mockSyncService = {
            upsertDocument: vi.fn().mockResolvedValue({ id: '123' })
        };
        const mockServices = {
            sync: {
                getSyncService: vi.fn().mockResolvedValue(mockSyncService)
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const documents = Array(1001).fill({
            title: 'Test Doc',
            content: 'Test Content',
            abstract: 'Test Abstract',
            authors: ['Author 1'],
            tags: ['tag1'],
            source: 'test-source'
        });

        const req = new NextRequest('http://localhost/api/documents/bulk', {
            method: 'POST',
            body: JSON.stringify({
                index: 'test-index',
                documents,
                tableName: 'custom-table'
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(mockSyncService.upsertDocument).toHaveBeenCalledTimes(1001);
        expect(data.success).toBe(true);
        expect(data.data.processed).toBe(1001);
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Processed batch'), expect.any(Object));
    });

    it('should reject invalid document schema', async () => {
        const req = new NextRequest('http://localhost/api/documents/bulk', {
            method: 'POST',
            body: JSON.stringify({
                index: 'test-index',
                documents: [{
                    title: 'Test Doc',
                    content: 'Test Content'
                    // missing required fields
                }]
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid request parameters');
    });

    it('should handle sync service errors', async () => {
        const mockServices = {
            sync: {
                getSyncService: vi.fn().mockRejectedValue(new Error('Sync service error'))
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new NextRequest('http://localhost/api/documents/bulk', {
            method: 'POST',
            body: JSON.stringify({
                index: 'test-index',
                documents: [{
                    title: 'Test Doc',
                    content: 'Test Content',
                    abstract: 'Test Abstract',
                    authors: ['Author 1'],
                    tags: ['tag1'],
                    source: 'test-source'
                }]
            })
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Bulk ingestion failed');
        expect(logger.error).toHaveBeenCalled();
    });
});
