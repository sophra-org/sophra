import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import { NextRequest } from 'next/server';
import { MockNextRequest } from './__mocks__/next-server';
import { mockPrisma } from '~/vitest.setup';

// Mock setup with proper typing
vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
    }
}));

vi.mock('@/lib/shared/database/client', () => ({
    default: {
        index: {
            create: vi.fn()
        }
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

vi.mock('next/server', () => {
    return vi.importActual<typeof import('./__mocks__/next-server')>('./__mocks__/next-server');
});

// Helper function to create URL object
const mockRequest = (params = {}) => {
    const url = new URL('http://localhost/api/cortex/indices');
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
    });
    return new MockNextRequest(url.toString());
};

describe('Indices API Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/cortex/indices', () => {
        it('should return formatted indices data', async () => {
            const mockIndices = [
                { index: 'test-1', health: 'green', 'docs.count': '100', 'store.size': '1024b' },
                { index: 'test-2', health: 'green', 'docs.count': '200', 'store.size': '2048b' }
            ];
            const mockServices = {
                elasticsearch: {
                    listIndices: vi.fn().mockResolvedValue(mockIndices)
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const response = await GET();
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data.indices).toHaveLength(2);
            expect(data.data.stats.totalIndices).toBe(2);
            expect(data.data.stats.totalDocuments).toBe(300);
            expect(data.data.stats.health).toBe('green');
        });

        it('should handle elasticsearch error response format', async () => {
            const mockError = {
                response: {
                    response: [
                        { index: 'test-1', health: 'green', 'docs.count': '100', 'store.size': '1024b' }
                    ]
                }
            };
            const mockServices = {
                elasticsearch: {
                    listIndices: vi.fn().mockRejectedValue(mockError)
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const response = await GET();
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data.indices).toHaveLength(1);
        });
    });

    describe('POST /api/cortex/indices', () => {
        it('should handle duplicate index creation gracefully', async () => {
            const mockServices = {
                elasticsearch: {
                    indexExists: vi.fn().mockResolvedValue(true),
                    createIndex: vi.fn()
                },
                metrics: {
                    incrementIndexError: vi.fn()
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
            vi.mocked(mockPrisma.index.create).mockResolvedValue({
                id: '1', name: 'test-index', status: 'active', created_at: new Date(), updated_at: new Date(),
                settings: null,
                mappings: null,
                deleted_at: null,
                doc_count: 0,
                size_bytes: 0,
                health: ''
            });

            const request = new MockNextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'test-index',
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 1
                    }
                })
            });

            const response = await POST(request as unknown as NextRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.message).toBe('Index already exists');
            expect(data.data.status).toBe('exists');
        });

        it('should return validation error for invalid request body', async () => {
            const mockServices = {
                elasticsearch: {
                    indexExists: vi.fn().mockResolvedValue(false),
                    createIndex: vi.fn()
                },
                metrics: {
                    incrementIndexError: vi.fn()
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const request = new MockNextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        number_of_shards: 'invalid'
                    }
                })
            });

            const response = await POST(request as unknown as NextRequest);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid request parameters');
            expect(data.details).toBeDefined();
            expect(data.details[0].message).toBeDefined();
        });
    });

    describe('DELETE /api/cortex/indices', () => {
        it('should return error when index parameter is missing', async () => {
            const request = new MockNextRequest('http://localhost?index=');

            const response = await DELETE(request as unknown as NextRequest);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Missing index parameter');
        });

        it('should successfully delete an index', async () => {
            const mockServices = {
                elasticsearch: {
                    deleteIndex: vi.fn().mockResolvedValue(true)
                }
            };
            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const request = new MockNextRequest('http://localhost?index=test-index');

            const response = await DELETE(request as unknown as NextRequest);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(mockServices.elasticsearch.deleteIndex).toHaveBeenCalledWith('test-index');
        });
    });
});
