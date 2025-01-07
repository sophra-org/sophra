import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import { NextRequest, NextResponse } from 'next/server';
import { MockNextRequest } from './__mocks__/next-server';
import { mockPrisma } from '~/vitest.setup';

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
    }
}));

vi.mock('@/lib/shared/database/client', () => ({
    default: {
        searchEvent: {
            create: vi.fn()
        }
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('next/server', () => {
    return vi.importActual<typeof import('./__mocks__/next-server')>('./__mocks__/next-server');
});

describe('POST /api/cortex/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should perform text search successfully', async () => {
        const mockSearchResult = {
            hits: {
                hits: [{ _id: '1', _score: 0.8 }],
                total: { value: 1 }
            },
            took: 5,
            aggregations: {}
        };

        const mockServices = {
            elasticsearch: {
                search: vi.fn().mockResolvedValue(mockSearchResult)
            }
        };

        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
        vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
            id: 'event-1',
            query: '',
            timestamp: new Date(),
            sessionId: '',
            searchType: '', 
            totalHits: 0,
            took: 0,
            facetsUsed: '',
            resultIds: [1, 2, 3],
            page: 0,
            pageSize: 0,
            filters: {}
        });

        const validBody = {
            index: 'test-index',
            searchType: 'text',
            textQuery: {
                query: 'test query',
                fields: ['title', 'content'],
                operator: 'AND',
                fuzziness: 'AUTO'
            }
        };

        const request = new MockNextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify(validBody)
        });

        const response = await POST(request as unknown as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.hits).toEqual(mockSearchResult.hits.hits);
    });

    it('should perform vector search successfully', async () => {
        const mockSearchResult = {
            hits: {
                hits: [{ _id: '1', _score: 0.9 }],
                total: { value: 1 }
            },
            took: 3,
            aggregations: {}
        };

        const mockServices = {
            elasticsearch: {
                search: vi.fn().mockResolvedValue(mockSearchResult)
            }
        };

        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
        vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
            id: 'event-2',
            query: '',
            timestamp: new Date(),
            sessionId: '',
            searchType: '',
            totalHits: 0,
            took: 0,
            facetsUsed: '',
            resultIds: [1, 2, 3],
            page: 0,
            pageSize: 0,
            filters: {}
        });

        const vector = new Array(3072).fill(0.1);
        const validBody = {
            index: 'test-index',
            searchType: 'vector',
            vectorQuery: {
                vector,
                field: 'embeddings',
                minScore: 0.7
            }
        };

        const request = new MockNextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify(validBody)
        });

        const response = await POST(request as unknown as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.hits).toEqual(mockSearchResult.hits.hits);
    });

    it('should handle faceted search correctly', async () => {
        const mockSearchResult = {
            hits: {
                hits: [{ _id: '1', _score: 0.8 }],
                total: { value: 1 }
            },
            took: 4,
            aggregations: {
                category: {
                    buckets: [
                        { key: 'technology', doc_count: 5 }
                    ]
                }
            }
        };

        const mockServices = {
            elasticsearch: {
                search: vi.fn().mockResolvedValue(mockSearchResult)
            }
        };

        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
        vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({
            id: 'event-3',
            query: '',
            timestamp: new Date(),
            sessionId: '',
            searchType: '',
            totalHits: 0,
            took: 0,
            facetsUsed: '',
            resultIds: [1, 2, 3],
            page: 0,
            pageSize: 0,
            filters: {}
        });

        const validBody = {
            index: 'test-index',
            searchType: 'text',
            textQuery: {
                query: 'test',
                fields: ['title']
            },
            facets: {
                fields: ['category'],
                size: 5
            }
        };

        const request = new MockNextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify(validBody)
        });

        const response = await POST(request as unknown as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data.aggregations).toEqual(mockSearchResult.aggregations);
    });

    it('should return 500 for invalid vector dimensions', async () => {
        const mockServices = {
            elasticsearch: {
                search: vi.fn()
            }
        };

        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const invalidBody = {
            index: 'test-index',
            searchType: 'vector',
            vectorQuery: {
                vector: [0.1, 0.2], // Invalid dimension
                field: 'embeddings'
            }
        };

        const request = new MockNextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify(invalidBody)
        });

        const response = await POST(request as unknown as NextRequest);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Search failed');
    });
});
