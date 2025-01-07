import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from './route';
import prisma from '@/lib/shared/database/client';
import { MockNextRequest } from '@/app/api/cortex/search/__mocks__/next-server';
import { NextResponse, NextRequest } from 'next/server';

vi.mock('@/lib/shared/database/client', () => ({
    default: {
        aBTest: {
            findFirst: vi.fn()
        },
        aBTestMetric: {
            createMany: vi.fn(),
            findMany: vi.fn()
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
    return vi.importActual<typeof import('@/app/api/cortex/search/__mocks__/next-server')>('@/app/api/cortex/search/__mocks__/next-server');
});

describe('AB Testing Results API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/nous/ab-testing/results', () => {
        it('should reject invalid request body', async () => {
            const invalidBody = {
                testId: 123,
                metrics: "invalid"
            };

            const request = new NextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify(invalidBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid request format');
        });
        it('should handle non-existent experiment', async () => {
            vi.mocked(prisma.aBTest.findFirst).mockResolvedValue(null);

            const validBody = {
                testId: 'test-1',
                variantId: 'variant-a',
                metrics: { clicks: 5 },
                sessionId: 'session-1'
            };

            const request = new NextRequest('http://localhost', {
                method: 'POST',
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Experiment not found or not active');
        });
        it('should successfully record metrics with metadata', async () => {
            vi.mocked(prisma.aBTest.findFirst).mockResolvedValue({
                id: 'test-1',
                status: 'ACTIVE',
                name: 'Test Experiment'
            } as any);

            vi.mocked(prisma.aBTestMetric.createMany).mockResolvedValue({ count: 2 });

            const validBody = {
                testId: 'test-1',
                variantId: 'variant-a',
                metrics: { clicks: 5, conversions: 1 },
                sessionId: 'session-1',
                metadata: { userAgent: 'test-browser' }
            };
            const request = new NextRequest('http://localhost', {
                body: JSON.stringify(validBody)
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.metricsRecorded).toBe(2);
        });
    });

            describe('GET /api/nous/ab-testing/results', () => {
                it('should reject request without testId', async () => {
                    const request = new NextRequest('http://localhost?param=value', {
                        method: 'GET'
                    });

                    const response = await GET(request);
                    const data = await response.json();

                    expect(response.status).toBe(400);
                    expect(data.success).toBe(false);
                    expect(data.error).toBe('Missing testId parameter');
                });
        });

                it('should return aggregated metrics', async () => {
                    const mockMetrics = [
                        { variantId: 'A', eventType: 'clicks', value: 5, timestamp: new Date() },
                        { variantId: 'A', eventType: 'clicks', value: 3, timestamp: new Date() },
                        { variantId: 'B', eventType: 'conversions', value: 1, timestamp: new Date() }
                    ];

                    vi.mocked(prisma.aBTestMetric.findMany).mockResolvedValue(mockMetrics as any);

                    const request = new NextRequest('http://localhost?testId=test-1', {
                        method: 'GET'
                    });

                    const response = await GET(request);
                    const data = await response.json();

                    expect(response.status).toBe(200);
                    expect(data.success).toBe(true);
                    expect(data.data.metrics.A.clicks).toEqual([5, 3]);
                    expect(data.data.metrics.B.conversions).toEqual([1]);
                });                it('should handle database errors gracefully', async () => {
                    vi.mocked(prisma.aBTestMetric.findMany).mockRejectedValue(new Error('Database error'));

                    const request = new NextRequest('http://localhost?testId=test-1', {
                        method: 'GET'
                    });

                    const response = await GET(request);
                    const data = await response.json();

                    expect(response.status).toBe(500);
                    expect(data.success).toBe(false);
                    expect(data.error).toBe('Failed to fetch metrics');
                });    
});