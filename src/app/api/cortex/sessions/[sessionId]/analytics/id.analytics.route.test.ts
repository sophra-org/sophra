import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextResponse } from 'next/server';
import { Services } from '@/lib/cortex/types/services';
import type { SearchEvent } from '@/lib/shared/database/validation/generated';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
    },
}));

describe('GET /api/cortex/sessions/[sessionId]/analytics', () => {
    const mockServices = {
        sessions: {
            getSession: vi.fn(),
        },
        analytics: {
            getSearchEvents: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
    });

    it('should return 404 if session is not found', async () => {
        mockServices.sessions.getSession.mockResolvedValue(null);

        const res = await GET({} as any, { params: { sessionId: 'non-existent' } });

        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toBe('Session not found');
    });

    it('should return 500 if service initialization fails', async () => {
        vi.mocked(serviceManager.getServices).mockRejectedValue(new Error('Service error'));

        const res = await GET({} as any, { params: { sessionId: 'test-123' } });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toBe('Failed to get session analytics');
    });

    it('should calculate metrics correctly with search events', async () => {
        const mockSession = { id: 'test-123' };
        const mockEvents = [
            { timestamp: new Date(), query: 'test', totalHits: 10, took: 100, searchType: 'basic' },
            { timestamp: new Date(), query: 'test2', totalHits: 20, took: 200, searchType: 'advanced' },
        ] as SearchEvent[];

        mockServices.sessions.getSession.mockResolvedValue(mockSession);
        mockServices.analytics.getSearchEvents.mockResolvedValue(mockEvents);

        const res = await GET({} as any, { params: { sessionId: 'test-123' } });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data.metrics.totalSearches).toBe(2);
        expect(json.data.metrics.averageLatency).toBe(150);
        expect(json.data.metrics.clickThroughRate).toBe(0);
    });

    it('should handle empty search events correctly', async () => {
        const mockSession = { id: 'test-123' };
        mockServices.sessions.getSession.mockResolvedValue(mockSession);
        mockServices.analytics.getSearchEvents.mockResolvedValue([]);

        const res = await GET({} as any, { params: { sessionId: 'test-123' } });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data.metrics.totalSearches).toBe(0);
        expect(json.data.metrics.averageLatency).toBe(0);
        expect(json.data.metrics.clickThroughRate).toBe(0);
    });

    it('should calculate click-through rate correctly', async () => {
        const mockSession = { id: 'test-123' };
        const mockEvents = [
            { filters: { userAction: 'clicked' } },
            { filters: { userAction: 'clicked' } },
            { filters: { userAction: 'viewed' } },
            {},
        ] as unknown as SearchEvent[];

        mockServices.sessions.getSession.mockResolvedValue(mockSession);
        mockServices.analytics.getSearchEvents.mockResolvedValue(mockEvents);

        const res = await GET({} as any, { params: { sessionId: 'test-123' } });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
        expect(json.data.metrics.clickThroughRate).toBe(0.5);
    });
})
