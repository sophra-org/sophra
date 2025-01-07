import { describe, expect, it, vi, beforeEach } from 'vitest';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import logger from '@/lib/shared/logger';
import { Services } from '@/lib/cortex/types/services';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('next/server', () => ({
    NextRequest: vi.fn().mockImplementation((url, init) => ({
        url,
        body: init?.body || '',
        method: init?.method || 'GET',
        cookies: {},
        geo: {},
        ip: '127.0.0.1',
        nextUrl: new URL(url),
        headers: new Headers(),
        text: async () => init?.body || '',
        json: async () => init?.body ? JSON.parse(init.body) : {}
    })),
    NextResponse: {
        json: vi.fn().mockImplementation((data, init) => ({
            status: init?.status || 200,
            ok: init?.status ? init.status >= 200 && init.status < 300 : true,
            headers: new Headers(),
            json: async () => data
        }))
    }
}));

import { POST, GET } from './route';

describe('POST /api/cortex/analytics/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now')
            .mockReturnValueOnce(1000) // Start time
            .mockReturnValueOnce(2000); // End time
    });

    it('should successfully create search event', async () => {
        const mockServices = {
            analytics: {
                createSearchEvent: vi.fn().mockResolvedValue({ id: '123' })
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const searchData = {
            query: 'test query',
            searchType: 'basic',
            totalHits: 10,
            took: 100,
            sessionId: 'session123',
            resultIds: ['1', '2'],
            filters: { category: 'test' }
        };

        const req = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/analytics/search', {
            method: 'POST',
            body: JSON.stringify(searchData)
        });

        const response = await POST(req);
        const data = await response.json();

        expect(mockServices.analytics.createSearchEvent).toHaveBeenCalledWith({
            query: searchData.query,
            searchType: searchData.searchType,
            totalHits: searchData.totalHits,
            took: searchData.took,
            timestamp: expect.any(Date),
            sessionId: searchData.sessionId,
            resultIds: searchData.resultIds,
            filters: searchData.filters
        });
        expect(data.success).toBe(true);
        expect(data.data.searchEvent).toMatchObject(searchData);
        expect(data.data.meta.took).toBe(1000); // End time - Start time = 2000 - 1000
    });

    it('should handle missing analytics service', async () => {
        const mockServices = {};
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/analytics/search', {
            method: 'POST',
            body: JSON.stringify({})
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to log search analytics');
        expect(data.details).toBe('Analytics service not initialized');
    });
});

describe('GET /api/cortex/analytics/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now')
            .mockReturnValueOnce(1000) // Start time
            .mockReturnValueOnce(2000); // End time
    });

    it('should retrieve search events with custom timeframe', async () => {
        const mockEvents = [{
            id: '1',
            query: 'test',
            searchType: 'basic',
            totalHits: 5,
            took: 50,
            timestamp: new Date(),
            sessionId: 'session1',
            facetsUsed: JSON.stringify(['category'])
        }];

        const mockServices = {
            analytics: {
                getSearchEvents: vi.fn().mockResolvedValue(mockEvents)
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/analytics/search?from=2023-01-01&to=2023-12-31');
        const response = await GET(req);
        const data = await response.json();

        expect(mockServices.analytics.getSearchEvents).toHaveBeenCalledWith({
            timeframe: '2023-01-01',
            limit: 100
        });
        expect(data.success).toBe(true);
        expect(data.data.searchEvents).toHaveLength(1);
        expect(data.data.meta.timeframe).toEqual({
            from: '2023-01-01',
            to: '2023-12-31'
        });
    });

    it('should handle invalid JSON in facetsUsed', async () => {
        const mockEvents = [{
            id: '1',
            query: 'test',
            searchType: 'basic',
            totalHits: 5,
            took: 50,
            timestamp: new Date(),
            sessionId: 'session1',
            facetsUsed: 'invalid-json'
        }];

        const mockServices = {
            analytics: {
                getSearchEvents: vi.fn().mockResolvedValue(mockEvents)
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/analytics/search');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to retrieve search analytics');
    });

    it('should handle service error', async () => {
        vi.mocked(serviceManager.getServices).mockRejectedValue(new Error('Service error'));

        const req = new (vi.mocked(require('next/server').NextRequest))('http://localhost/api/analytics/search');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to retrieve search analytics');
        expect(logger.error).toHaveBeenCalled();
    });
});
