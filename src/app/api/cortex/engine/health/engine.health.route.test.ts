import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/shared/logger';
import { Services } from '@/lib/cortex/types/services';

// Mock dependencies
vi.mock('@/lib/cortex/utils/service-manager', () => ({
    serviceManager: {
        getServices: vi.fn()
    }
}));

vi.mock('@/lib/shared/logger', () => ({
    default: {
        debug: vi.fn(),
        error: vi.fn(),
        service: ''
    }
}));

vi.mock('next/server', () => ({
    NextRequest: class {
        url: string;
        nextUrl: URL;
        
        constructor(url: string) {
            this.url = url;
            this.nextUrl = new URL(url);
        }
        
        json() {
            return Promise.resolve({});
        }
    },
    NextResponse: {
        json: (data: any, init?: ResponseInit) => ({
            ...new Response(JSON.stringify(data), init),
            json: () => Promise.resolve(data),
            status: init?.status || 200,
            headers: new Headers(init?.headers),
            ok: init?.status ? init.status >= 200 && init.status < 300 : true,
            statusText: init?.statusText || 'OK'
        }),
    },
}));

describe('GET /api/cortex/engine/health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        
        // Mock Date.now to return increasing values
        let now = 1000;
        vi.spyOn(Date, 'now').mockImplementation(() => {
            now += 100;
            return now;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should return healthy status when engine is operational', async () => {
        const mockEngineService = {
            testService: vi.fn().mockResolvedValue({
                operational: true,
                errors: [],
                metrics: {
                    status: 'healthy',
                    uptime: 3600,
                    operations: {
                        total: 100,
                        successful: 95,
                        failed: 5,
                        pending: 0,
                        lastOperation: '2024-01-01T00:00:00Z'
                    },
                    performance: {
                        latency: {
                            p50: 100,
                            p95: 200,
                            p99: 300,
                            average: 150
                        },
                        throughput: {
                            current: 50,
                            average: 45,
                            peak: 100
                        }
                    },
                    resources: {
                        cpu: {
                            usage: 0,
                            limit: 0
                        },
                        memory: {
                            used: 0,
                            allocated: 0,
                            peak: 0
                        },
                        connections: {
                            active: 0,
                            idle: 0,
                            max: 0
                        }
                    },
                    learning: {
                        activeStrategies: 0,
                        successfulOptimizations: 0,
                        failedOptimizations: 0,
                        lastOptimization: null
                    }
                }
            })
        };
        const mockServices = {
            engine: mockEngineService
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new NextRequest('http://localhost/api/engine/health');
        
        // Advance time by 100ms to simulate processing time
        vi.advanceTimersByTime(100);
        
        const response = await GET(req);
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.data.overall).toBe(true);
        expect(data.data.engine.operational).toBe(true);
        expect(data.data.engine.errors).toHaveLength(0);
        expect(data.meta.took).toBeGreaterThan(0);
    });

    it('should handle service timeout correctly', async () => {
        const mockEngineService = {
            testService: vi.fn().mockImplementation(() => new Promise(resolve => {
                setTimeout(resolve, 6000);
            }))
        };
        const mockServices = {
            engine: mockEngineService
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new NextRequest('http://localhost/api/engine/health');
        
        // Run all pending timers
        const responsePromise = GET(req);
        await vi.runAllTimersAsync();
        const response = await responsePromise;
        const data = await response.json();

        expect(data.data.engine.operational).toBe(false);
        expect(data.data.engine.errors).toContain('engine check timed out');
    });

    it('should handle missing engine service gracefully', async () => {
        const mockServices = {
            engine: null
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new NextRequest('http://localhost/api/engine/health');
        const response = await GET(req);
        const data = await response.json();

        expect(data.data.engine.operational).toBe(false);
        expect(data.data.engine.metrics).toBeDefined();
    });

    it('should handle service manager failure', async () => {
        vi.mocked(serviceManager.getServices).mockRejectedValue(new Error('Service manager failed'));

        const req = new NextRequest('http://localhost/api/engine/health');
        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Service manager failed');
        expect(logger.error).toHaveBeenCalled();
    });

    it('should include all required metrics in healthy response', async () => {
        const mockEngineService = {
            testService: vi.fn().mockResolvedValue({
                operational: true,
                errors: [],
                metrics: {
                    status: 'healthy',
                    uptime: 3600,
                    operations: {
                        total: 100,
                        successful: 95,
                        failed: 5,
                        pending: 0,
                        lastOperation: '2024-01-01T00:00:00Z'
                    },
                    performance: {
                        latency: {
                            p50: 100,
                            p95: 200,
                            p99: 300,
                            average: 150
                        },
                        throughput: {
                            current: 50,
                            average: 45,
                            peak: 100
                        }
                    },
                    resources: {
                        cpu: {
                            usage: 0,
                            limit: 0
                        },
                        memory: {
                            used: 0,
                            allocated: 0,
                            peak: 0
                        },
                        connections: {
                            active: 0,
                            idle: 0,
                            max: 0
                        }
                    },
                    learning: {
                        activeStrategies: 0,
                        successfulOptimizations: 0,
                        failedOptimizations: 0,
                        lastOptimization: null
                    }
                }
            })
        };
        const mockServices = {
            engine: mockEngineService
        };
        vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

        const req = new NextRequest('http://localhost/api/engine/health');
        const response = await GET(req);
        const data = await response.json();

        expect(data.data.engine.metrics).toMatchObject({
            status: expect.any(String),
            uptime: expect.any(Number),
            operations: expect.any(Object),
            performance: expect.any(Object),
            resources: expect.any(Object),
            learning: expect.any(Object)
        });
    });
});
