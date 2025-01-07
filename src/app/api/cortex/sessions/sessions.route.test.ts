import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/shared/logger';
import { Services } from '@/lib/cortex/types/services';

vi.mock('@/lib/cortex/utils/service-manager');
vi.mock('@/lib/shared/logger');
vi.mock('next/server', () => ({
    NextRequest: vi.fn().mockImplementation((url, options = {}) => ({
        url,
        method: options.method || 'GET',
        headers: new Headers(options.headers || {}),
        body: options.body,
        json: async () => options.body ? JSON.parse(options.body) : undefined,
        nextUrl: new URL(url),
        searchParams: new URLSearchParams(new URL(url).search)
    })),
    NextResponse: {
        json: (data: any, init?: ResponseInit) => ({
            status: init?.status || 200,
            headers: new Headers(init?.headers || {}),
            json: async () => data,
            ok: true,
            body: JSON.stringify(data)
        }),
    },
}));

describe('Sessions API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/sessions', () => {
        it('should create a new session with valid metadata', async () => {
            const mockSession = {
                id: 'test-id',
                userId: 'user-123',
                startedAt: new Date(),
                lastActiveAt: new Date(),
                metadata: { key: 'value' },
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const mockServices = {
                sessions: {
                    createSession: vi.fn().mockResolvedValue(mockSession),
                    cacheSession: vi.fn().mockResolvedValue(undefined)
                },
                metrics: {
                    recordLatency: vi.fn(),
                    incrementSearchError: vi.fn()
                }
            };

            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const req = new NextRequest('http://localhost/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    userId: 'user-123',
                    metadata: { key: 'value' }
                })
            });

            const response = await POST(req);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data.sessionId).toBe('test-id');
            expect(mockServices.sessions.createSession).toHaveBeenCalledWith({
                userId: 'user-123',
                metadata: { key: 'value' }
            });
        });

        it('should return 400 for invalid metadata type', async () => {
            const req = new NextRequest('http://localhost/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    metadata: 'invalid'
                })
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Metadata must be an object');
        });

        it('should return 400 for invalid userId type', async () => {
            const req = new NextRequest('http://localhost/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    userId: 123
                })
            });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('User ID must be a string');
        });
    });

    describe('GET /api/sessions', () => {
        it('should retrieve a session by id', async () => {
            const mockSession = {
                id: 'test-id',
                userId: 'user-123',
                metadata: {}
            };

            const mockServices = {
                sessions: {
                    getSession: vi.fn().mockResolvedValue(mockSession)
                }
            };

            vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as unknown as Services);

            const req = new NextRequest('http://localhost/api/sessions?id=test-id');
            const response = await GET(req);
            const data = await response.json();

            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockSession);
            expect(mockServices.sessions.getSession).toHaveBeenCalledWith('test-id');
        });

        it('should return 400 when session id is missing', async () => {
            const req = new NextRequest('http://localhost/api/sessions');
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Session ID required');
        });

        it('should handle service errors', async () => {
            const mockError = new Error('Service error');
            vi.mocked(serviceManager.getServices).mockRejectedValue(mockError);

            const req = new NextRequest('http://localhost/api/sessions?id=test-id');
            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.error).toBe('Failed to retrieve session');
            expect(logger.error).toHaveBeenCalledWith('Failed to retrieve session', {
                error: mockError
            });
        });
    });
});
