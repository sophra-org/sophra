import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockPrisma } from '@/../vitest.setup';

vi.mock('@/lib/shared/database/client', () => ({
    prisma: mockPrisma
}));

vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
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

import { GET, POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import { prisma } from '@/lib/shared/database/client';
import logger from '@/lib/shared/logger';
import { NextRequest, NextResponse } from 'next/server';
import { MockNextRequest } from './__mocks__/next-server';

// Helper function to create URL object
const mockRequest = (params = {}) => {
    const url = new URL('http://localhost/api/cortex/feedback');
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
    });
    return new MockNextRequest(url.toString());
};

describe('GET /api/cortex/feedback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Date.now to return increasing values
        let now = 1000;
        vi.spyOn(Date, 'now').mockImplementation(() => {
            now += 100;
            return now;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return feedback data with default parameters', async () => {
        const mockFeedback = [{ id: '1', feedback: { rating: 1 }, timestamp: new Date() }];
        vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

        const req = mockRequest();
        const res = await GET(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockFeedback);
        expect(data.metadata.timeframe).toBe('24h');
        expect(data.metadata.took).toBeGreaterThan(0);
    });

    it('should handle custom timeframe and limit parameters', async () => {
        const mockFeedback = [{ id: '1', feedback: { rating: 1 }, timestamp: new Date() }];
        vi.mocked(mockPrisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

        const req = mockRequest({ timeframe: '7d', limit: '50' });
        const res = await GET(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.metadata.timeframe).toBe('7d');
        expect(data.metadata.took).toBeGreaterThan(0);
        expect(vi.mocked(mockPrisma.feedbackRequest.findMany)).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 50
            })
        );
    });

    it('should handle database errors gracefully', async () => {
        vi.mocked(mockPrisma.feedbackRequest.findMany).mockRejectedValue(new Error('Database error'));

        const req = mockRequest();
        const res = await GET(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch feedback');
        expect(data.meta.took).toBeGreaterThan(0);
        expect(logger.error).toHaveBeenCalled();
    });
});

describe('POST /api/cortex/feedback', () => {
    const mockServices = {
        feedback: {
            recordFeedbackWithOptimization: vi.fn(),
        },
    };

    const validFeedbackBody = {
        sessionId: 'test-session',
        feedback: [{
            queryId: 'query123',
            rating: 1,
            metadata: {
                userAction: 'USER_BEHAVIOR_CLICK',
                resultId: 'result123',
                queryHash: 'hash123',
                timestamp: new Date().toISOString(),
                customMetadata: {}
            }
        }]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock Date.now to return increasing values
        let now = 1000;
        vi.spyOn(Date, 'now').mockImplementation(() => {
            now += 100;
            return now;
        });
        
        vi.mocked(mockPrisma.session.findUnique).mockResolvedValue({
            id: 'test-session',
            data: {},
            metadata: {},
            userId: null,
            startedAt: new Date(),
            lastActiveAt: new Date(),
            expiresAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        vi.mocked(mockPrisma.searchEvent.create).mockResolvedValue({ 
            id: 'search123',
            timestamp: new Date(),
            filters: {},
            query: 'hash123',
            searchType: 'FEEDBACK',
            totalHits: 0,
            took: 0,
            sessionId: 'test-session',
            facetsUsed: null,
            resultIds: [],
            page: 1,
            pageSize: 10
        });
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should handle missing feedback service', async () => {
        vi.mocked(serviceManager.getServices).mockResolvedValue({} as unknown as Services);

        const req = new MockNextRequest('http://localhost/api/cortex/feedback', {
            method: 'POST',
            body: JSON.stringify(validFeedbackBody)
        });
        const res = await POST(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to record feedback');
        expect(res.status).toBe(500);
    });

    it('should reject invalid session IDs', async () => {
        vi.mocked(mockPrisma.session.findUnique).mockResolvedValue(null);

        const req = new MockNextRequest('http://localhost/api/cortex/feedback', {
            method: 'POST',
            body: JSON.stringify(validFeedbackBody)
        });
        const res = await POST(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid session');
        expect(res.status).toBe(404);
    });

    it('should handle feedback processing errors', async () => {
        mockServices.feedback.recordFeedbackWithOptimization.mockRejectedValue(new Error('Processing error'));

        const req = new MockNextRequest('http://localhost/api/cortex/feedback', {
            method: 'POST',
            body: JSON.stringify(validFeedbackBody)
        });
        const res = await POST(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to record feedback');
        expect(res.status).toBe(500);
        expect(logger.error).toHaveBeenCalled();
    });

    it('should successfully process valid feedback', async () => {
        const req = new MockNextRequest('http://localhost/api/cortex/feedback', {
            method: 'POST',
            body: JSON.stringify(validFeedbackBody)
        });
        const res = await POST(req as unknown as NextRequest);
        const data = await res.json();

        expect(data.success).toBe(true);
        expect(data.data.feedbackCount).toBe(1);
        expect(data.data.feedback[0].queryId).toBe('query123');
        expect(mockServices.feedback.recordFeedbackWithOptimization).toHaveBeenCalledWith(
            expect.objectContaining({
                searchId: 'query123',
                queryHash: 'hash123',
                resultId: 'result123',
                relevanceScore: 5,
                userAction: 'clicked'
            })
        );
    });
});
