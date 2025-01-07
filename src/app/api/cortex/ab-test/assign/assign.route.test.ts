import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
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
            json: vi.fn().mockImplementation((data, init) => {
                return {
                    status: init?.status || 200,
                    json: async () => data,
                    headers: new Headers(),
                    ok: init?.status ? init.status >= 200 && init.status < 300 : true,
                };
            }),
        },
    };
});

describe('POST /api/cortex/ab-test/assign', () => {
    const mockRequest = (body: any) => {
        return new NextRequest('http://localhost/api/cortex/ab-test/assign', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    };

    const mockServices = {
        abTesting: {
            getTestByName: vi.fn(),
            assignVariant: vi.fn(),
        },
        metrics: {
            recordLatency: vi.fn(),
            incrementMetric: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
    });

    it('should return 500 if service initialization fails', async () => {
        vi.mocked(serviceManager.getServices).mockRejectedValue(new Error('Service error'));

        const req = mockRequest({ sessionId: 'abc123', testId: 'test-123' });
        const res = await POST(req);
        const json = await res.json();
        
        expect(res.status).toBe(500);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Service initialization failed');
    });

    it('should return 400 if request body is invalid', async () => {
        const req = mockRequest({ invalid: 'data' });
        const res = await POST(req);
        const json = await res.json();
        
        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Invalid request parameters');
    });

    it('should return 404 if test is not found by name', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.abTesting.getTestByName).mockResolvedValue(null);

        const req = mockRequest({ sessionId: 'abc123', testName: 'non-existent-test' });
        const res = await POST(req);
        const json = await res.json();
        
        expect(res.status).toBe(404);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Test not found');
    });

    it('should return 404 if no eligible variant is found', async () => {
        const services = await serviceManager.getServices();
        vi.mocked(services.abTesting.assignVariant).mockResolvedValue(null as any);

        const req = mockRequest({ sessionId: 'abc123', testId: 'test-123' });
        const res = await POST(req);
        const json = await res.json();
        
        expect(res.status).toBe(404);
        expect(json.success).toBe(false);
        expect(json.error).toBe('No eligible variant found');
    });

    it('should return 200 and assign a variant successfully', async () => {
        const mockAssignment = {
            id: 'variant-123',
            name: 'Test Variant',
            allocation: 100,
            weights: {}
        };
        const services = await serviceManager.getServices();
        vi.mocked(services.abTesting.assignVariant).mockResolvedValue(mockAssignment);

        const req = mockRequest({ sessionId: 'abc123', testId: 'test-123' });
        const res = await POST(req);
        const json = await res.json();
        
        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toEqual({
            testId: 'test-123',
            variantId: 'variant-123',
            weights: {},
        });
    });
});