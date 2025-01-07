import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import { NextRequest } from 'next/server';

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        error: vi.fn()
    }
}));

vi.mock('next/server', () => {
    return {
        NextRequest: class MockNextRequest {
            private body: string;
            constructor(url: string, init: { method: string; body: string }) {
                this.body = init.body;
            }
            async text() {
                return this.body;
            }
        },
        NextResponse: {
            json: vi.fn().mockImplementation((data, init) => ({
                status: init?.status || 200,
                json: async () => data,
                headers: new Headers(),
                ok: init?.status ? init.status >= 200 && init.status < 300 : true,
            })),
        },
    };
});

describe('POST /api/cortex/ab-test/create', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create an A/B test successfully', async () => {
        const mockTest = { id: 'test-1' };
        const mockServices = {
            abTesting: {
                createTest: vi.fn().mockResolvedValue(mockTest)
            },
            elasticsearch: {},
            redis: {},
            postgres: {},
            vectorization: {},
            analytics: {},
            feedback: {},
            metrics: {},
            sessions: {},
            notifications: {},
            search: {},
            storage: {},
            users: {},
            recommendations: {},
            observe: {},
            learning: {},
            engine: {},
            sync: {},
            config: {},
            events: {},
        } as unknown as Services;
        
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices);

        const validBody = {
            name: "Test Campaign",
            variants: [
                {
                    id: "control",
                    name: "Control",
                    allocation: 0.5,
                    weights: { score: 1.0 }
                },
                {
                    id: "variant_a", 
                    name: "Variant A",
                    allocation: 0.5,
                    weights: { score: 1.2 }
                }
            ]
        };

        const request = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify(validBody)
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(200);
        expect(responseData.success).toBe(true);
        expect(responseData.data).toEqual(mockTest);
    });

    it('should return 500 when abTesting service is not available', async () => {
        const mockServices = {
            abTesting: null,
            elasticsearch: {},
            redis: {},
            postgres: {},
            vectorization: {},
            analytics: {},
            feedback: {},
            metrics: {},
            sessions: {},
            notifications: {},
            search: {},
            storage: {},
            users: {},
            recommendations: {},
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
        
        const request = new NextRequest('http://localhost', {
            method: 'POST',
            body: JSON.stringify({
                name: "Test Campaign",
                variants: [
                    {
                        id: "control",
                        name: "Control",
                        allocation: 0.5,
                        weights: { score: 1.0 }
                    },
                    {
                        id: "variant_a", 
                        name: "Variant A",
                        allocation: 0.5,
                        weights: { score: 1.2 }
                    }
                ]
            })
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.success).toBe(false);
        expect(responseData.error).toBe('Failed to create A/B test');
    });
});