import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, runtime } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';
import { LearningEventType } from '@prisma/client';

// Mock dependencies
vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    learningEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
      $queryRaw: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

interface MockEvent {
  id: string;
  type: LearningEventType;
  priority: string;
  timestamp: Date;
  processedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  correlationId: string;
  sessionId: string;
  userId: string;
  clientId: string;
  environment: string;
  version: string;
  tags: string[];
  error: string | null;
  retryCount: number;
}

describe('Events Route Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use Node.js runtime', () => {
      expect(runtime).toBe('nodejs');
    });
  });

  describe('GET Endpoint', () => {
    const createMockEvent = (): MockEvent => ({
      id: 'event-1',
      type: LearningEventType.SEARCH_PATTERN,
      priority: 'HIGH',
      timestamp: new Date(),
      processedAt: new Date(),
      metadata: { test: true },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'COMPLETED',
      correlationId: 'corr-1',
      sessionId: 'session-1',
      userId: 'user-1',
      clientId: 'client-1',
      environment: 'test',
      version: '1.0.0',
      tags: ['test'],
      error: null,
      retryCount: 0,
    });

    it('should check database connection', async () => {
      const mockEvent = createMockEvent();
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('DB connection successful');
    });

    it('should handle database connection failure', async () => {
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection failed'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        success: false,
        error: 'Database connection failed',
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          errorDetails: 'Connection failed',
        }),
      });
    });

    it('should validate query parameters', async () => {
      const request = new NextRequest('http://localhost/api/learn/events?limit=invalid');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid query parameters',
        details: expect.any(Object),
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          details: expect.any(Object),
        }),
      });
    });

    it('should handle empty results', async () => {
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]); // Query result

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [],
        meta: {
          total: 0,
          timestamp: expect.any(String),
          limit: 100,
        },
      });
    });

    it('should process valid request with default parameters', async () => {
      const mockEvent = createMockEvent();
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [expect.objectContaining({ id: 'event-1' })],
        meta: {
          total: 1,
          timestamp: expect.any(String),
          limit: 100,
        },
      });
    });

    it('should handle custom limit', async () => {
      const mockEvent = createMockEvent();
      const request = new NextRequest('http://localhost/api/learn/events?limit=50');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      const response = await GET(request);
      const data = await response.json();

      expect(data.meta.limit).toBe(50);
      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50')
      );
    });

    it('should handle date range filtering', async () => {
      const mockEvent = createMockEvent();
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const request = new NextRequest(
        `http://localhost/api/learn/events?startDate=${startDate}&endDate=${endDate}`
      );

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      await GET(request);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('timestamp >=')
      );
      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('timestamp <=')
      );
    });

    it('should handle event type filtering', async () => {
      const mockEvent = createMockEvent();
      const request = new NextRequest(
        `http://localhost/api/learn/events?type=${LearningEventType.SEARCH_PATTERN}`
      );

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      await GET(request);

      expect(prisma.$queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('type::text =')
      );
    });

    it('should handle database query errors', async () => {
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Query failed'));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to retrieve learning events',
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          errorType: 'Error',
          total: 0,
          limit: 100,
        }),
      });
    });

    it('should handle non-Error objects in catch blocks', async () => {
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockImplementationOnce(() => {
        throw 'String error'; // Non-Error object
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.meta.errorType).toBe('string');
    });

    it('should log event retrieval details', async () => {
      const mockEvent = createMockEvent();
      const request = new NextRequest('http://localhost/api/learn/events');
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([1]); // DB check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([mockEvent]);

      await GET(request);

      expect(logger.info).toHaveBeenCalledWith(
        'Retrieved learning events',
        expect.objectContaining({
          count: 1,
          limit: 100,
        })
      );
    });
  });
});
