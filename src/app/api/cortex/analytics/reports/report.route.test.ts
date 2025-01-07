import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/shared/logger';
import { Services } from '@/lib/cortex/types/services';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('next/server', () => {
    const actual = vi.importActual('next/server');
    return {
        ...actual,
        NextRequest: vi.fn().mockImplementation((url) => {
            const parsedUrl = new URL(url);
            return {
                url,
                json: () => Promise.resolve({}),
                nextUrl: parsedUrl,
                headers: new Headers(),
                searchParams: parsedUrl.searchParams,
                method: 'GET',
                clone: () => this
            };
        }),
        NextResponse: {
            json: vi.fn().mockImplementation((data, options = {}) => {
                const headers = new Headers(options.headers);
                const status = options.status || 200;
                return {
                    ...new Response(),
                    status,
                    headers,
                    json: () => Promise.resolve(data),
                    ok: status >= 200 && status < 300,
                    clone: () => this
                };
            })
        }
    };
});

describe('GET analytics report', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return analytics report with default timeWindow', async () => {
        const mockReport = { data: 'test report' };
        const mockServices = {
            analytics: {
                generateReport: vi.fn().mockResolvedValue(mockReport)
            },
            // ... rest of mock services ...
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
                
        const req = new NextRequest('http://localhost/api/analytics/reports');
        const response = await GET(req);
        const data = await response.json();

        expect(mockServices.analytics.generateReport).toHaveBeenCalledWith('24h');
        expect(data).toEqual({
            success: true,
            data: mockReport,
            meta: {
                timeWindow: '24h',
                timestamp: expect.any(String)
            }
        });
    });

    it('should use custom timeWindow from query params', async () => {
        const mockReport = { data: 'test report' };
        const mockServices = {
            analytics: {
                generateReport: vi.fn().mockResolvedValue(mockReport)
            }
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
        
        const req = new NextRequest('http://localhost/api/analytics/reports?timeWindow=7d');
        const response = await GET(req);
        const data = await response.json();

        expect(mockServices.analytics.generateReport).toHaveBeenCalledWith('7d');
        expect(data.meta.timeWindow).toBe('7d');
    });

    it('should handle errors and return 500 status', async () => {
        const mockError = new Error('Test error');
        vi.spyOn(serviceManager, 'getServices').mockRejectedValue(mockError);
        
        const req = new NextRequest('http://localhost/api/analytics/reports');
        const response = await GET(req);
        const data = await response.json();

        expect(logger.error).toHaveBeenCalledWith('Failed to generate analytics report', {
            error: mockError,
            errorType: 'Error',
            errorMessage: 'Test error'
        });
        expect(response.status).toBe(500);
        expect(data).toEqual({
            success: false,
            error: 'Failed to generate analytics report',
            details: 'Test error'
        });
    });
});