import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { serviceManager } from '@/lib/cortex/utils/service-manager';
import logger from '@/lib/shared/logger';

// Mock dependencies
vi.mock('@/lib/cortex/utils/service-manager', () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Sessions API Additional Tests', () => {
  const mockSessionsService = {
    createSession: vi.fn(),
    getSession: vi.fn(),
  };

  const mockRedisService = {
    set: vi.fn(),
  };

  const mockMetricsService = {
    recordLatency: vi.fn(),
    incrementSearchError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(serviceManager.getServices).mockResolvedValue({
      sessions: mockSessionsService,
      redis: mockRedisService,
      metrics: mockMetricsService,
    } as any);

    mockSessionsService.createSession.mockResolvedValue({
      id: 'test-session-id',
      userId: 'test-user',
      metadata: {},
      createdAt: new Date(),
    });
  });

  describe('POST Endpoint', () => {
    describe('Request Validation', () => {
      it('should handle invalid JSON body', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid JSON body');
      });

      it('should validate metadata type', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            metadata: 'invalid-type', // Should be an object
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Metadata must be an object');
      });

      it('should validate userId type', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            userId: 123, // Should be a string
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('User ID must be a string');
      });
    });

    describe('Session Creation', () => {
      it('should create session successfully', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            userId: 'test-user',
            metadata: { source: 'test' },
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(
          expect.objectContaining({
            sessionId: 'test-session-id',
            userId: 'test-user',
          })
        );
      });

      it('should handle optional fields', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({}), // No userId or metadata
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should cache session in Redis', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            userId: 'test-user',
          }),
        });

        await POST(request);

        expect(mockRedisService.set).toHaveBeenCalledWith(
          'session:test-session-id',
          expect.any(String),
          3600
        );
      });

      it('should record metrics', async () => {
        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        await POST(request);

        expect(mockMetricsService.recordLatency).toHaveBeenCalledWith(
          'session_creation',
          'api',
          expect.any(Number)
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle session creation failure', async () => {
        mockSessionsService.createSession.mockRejectedValue(
          new Error('Creation failed')
        );

        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create session');
        expect(mockMetricsService.incrementSearchError).toHaveBeenCalledWith({
          search_type: 'session',
          index: 'sessions',
          error_type: 'Error',
        });
      });

      it('should handle Redis caching failure', async () => {
        mockRedisService.set.mockRejectedValue(new Error('Redis error'));

        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to create session',
          expect.any(Object)
        );
      });

      it('should handle non-Error exceptions', async () => {
        mockSessionsService.createSession.mockRejectedValue('Unknown error');

        const request = new NextRequest('http://localhost/api/sessions', {
          method: 'POST',
          body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details).toBe('Unknown error');
      });
    });
  });

  describe('GET Endpoint', () => {
    describe('Parameter Validation', () => {
      it('should require session ID', async () => {
        const request = new NextRequest('http://localhost/api/sessions');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Session ID required');
      });
    });

    describe('Session Retrieval', () => {
      it('should retrieve session successfully', async () => {
        const mockSession = {
          id: 'test-session-id',
          userId: 'test-user',
          metadata: {},
        };

        mockSessionsService.getSession.mockResolvedValue(mockSession);

        const request = new NextRequest(
          'http://localhost/api/sessions?id=test-session-id'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockSession);
      });

      it('should handle session not found', async () => {
        mockSessionsService.getSession.mockResolvedValue(null);

        const request = new NextRequest(
          'http://localhost/api/sessions?id=non-existent'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should handle retrieval errors', async () => {
        mockSessionsService.getSession.mockRejectedValue(
          new Error('Retrieval failed')
        );

        const request = new NextRequest(
          'http://localhost/api/sessions?id=test-session-id'
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to retrieve session');
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to retrieve session',
          expect.any(Object)
        );
      });
    });
  });

  describe('Helper Functions', () => {
    it('should convert Prisma session format correctly', async () => {
      const prismaSession = {
        id: 'test-id',
        userId: 'test-user',
        startedAt: new Date(),
        lastActiveAt: new Date(),
        metadata: { source: 'test' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const request = new NextRequest('http://localhost/api/sessions', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      mockSessionsService.createSession.mockResolvedValue(prismaSession);

      const response = await POST(request);
      const data = await response.json();

      expect(data.data).toEqual(
        expect.objectContaining({
          id: prismaSession.id,
          userId: prismaSession.userId,
          metadata: prismaSession.metadata,
        })
      );
    });

    it('should handle null metadata in conversion', async () => {
      const prismaSession = {
        id: 'test-id',
        userId: 'test-user',
        startedAt: new Date(),
        lastActiveAt: new Date(),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const request = new NextRequest('http://localhost/api/sessions', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      mockSessionsService.createSession.mockResolvedValue(prismaSession);

      const response = await POST(request);
      const data = await response.json();

      expect(data.data.metadata).toEqual({});
    });
  });
});
