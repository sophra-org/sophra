import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { Services } from '@/lib/cortex/types/services';
import logger from '@/lib/shared/logger';
import { NextRequest, NextResponse } from 'next/server';
import { MockNextRequest } from './__mocks__/next-server';

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

describe('GET /api/cortex/metrics', () => {
    const mockServices = {
        metrics: {
            getMetrics: vi.fn()
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);
    });

    it('should return metrics data with correct content type header', async () => {
        const mockMetricsData = 'sophra_metric_1{label="value"} 1\nsophra_metric_2{label="value"} 2';
        mockServices.metrics.getMetrics.mockResolvedValue(mockMetricsData);

        const request = new MockNextRequest('http://localhost:3000/api/cortex/metrics');
        const response = await GET(request as unknown as NextRequest);
        const content = await response.text();
        const headers = response.headers;

        expect(content).toBe(mockMetricsData);
        expect(headers.get('Content-Type')).toBe('text/plain; version=0.0.4');
    });

    it('should handle empty metrics data', async () => {
        mockServices.metrics.getMetrics.mockResolvedValue(null);

        const request = new MockNextRequest('http://localhost:3000/api/cortex/metrics');
        const response = await GET(request as unknown as NextRequest);
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to get metrics');
    });

    it('should handle service errors gracefully', async () => {
        const serviceError = new Error('Service error');
        mockServices.metrics.getMetrics.mockRejectedValue(serviceError);

        const request = new MockNextRequest('http://localhost:3000/api/cortex/metrics');
        const response = await GET(request as unknown as NextRequest);
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to get metrics');
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
            'Failed to get metrics',
            expect.objectContaining({
                error: 'Service error',
                stack: expect.stringContaining('Error: Service error')
            })
        );
    });

    it('should handle missing metrics service', async () => {
        vi.mocked(serviceManager.getServices).mockResolvedValue({} as unknown as Services);

        const request = new MockNextRequest('http://localhost:3000/api/cortex/metrics');
        const response = await GET(request as unknown as NextRequest);
        const data = await response.json();

        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to get metrics');
    });

    it('should log debug information for valid metrics', async () => {
        const mockMetricsData = 'sophra_metric_1{label="value"} 1\nsophra_metric_2{label="value"} 2';
        mockServices.metrics.getMetrics.mockResolvedValue(mockMetricsData);

        const request = new MockNextRequest('http://localhost:3000/api/cortex/metrics');
        await GET(request as unknown as NextRequest);

        expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
            'Retrieved metrics',
            expect.objectContaining({
                metricsLength: mockMetricsData.length,
                availableMetrics: expect.any(Array)
            })
        );
    });
});
