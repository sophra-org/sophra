import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import logger from '../../../../../lib/shared/logger';

// Mock modules
vi.mock('../../../../../lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('next/server', () => ({
  NextRequest: vi.fn().mockImplementation((url) => ({
    url,
    nextUrl: new URL(url),
    headers: new Headers(),
    json: vi.fn()
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

vi.mock('../../../../../lib/shared/database/client', () => {
  const mockPrisma = {
    aBTest: {
      findFirst: vi.fn()
    },
    aBTestMetric: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn()
    }
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '../../../../../lib/shared/database/client';
import { GET, POST } from './route';

describe('AB Testing Results API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/nous/ab-testing/results', () => {
    it('should reject invalid request body', async () => {
      const invalidBody = {
        testId: 123, // Should be string
        metrics: "invalid" // Should be record of numbers
      };

      const request = new NextRequest('http://localhost/api/nous/ab-testing/results');
      request.json = vi.fn().mockResolvedValue(invalidBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });

    it('should create new test metrics', async () => {
      const validBody = {
        testId: 'test-1',
        variantId: 'variant-a',
        sessionId: 'session-1',
        metrics: {
          impressions: 100,
          clicks: 10,
          conversions: 2
        }
      };

      vi.mocked(prisma.aBTest.findFirst).mockResolvedValue({
        id: 'test-1',
        status: 'ACTIVE',
        name: 'Test Experiment',
        description: 'Test description',
        startDate: new Date(),
        endDate: new Date(),
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.aBTestMetric.createMany).mockResolvedValue({ count: 3 });

      const request = new NextRequest('http://localhost/api/nous/ab-testing/results');
      request.json = vi.fn().mockResolvedValue(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        testId: validBody.testId,
        variantId: validBody.variantId,
        metricsRecorded: 3
      });
      expect(prisma.aBTestMetric.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            testId: validBody.testId,
            variantId: validBody.variantId,
            sessionId: validBody.sessionId,
            eventType: 'impressions',
            value: 100
          }),
          expect.objectContaining({
            testId: validBody.testId,
            variantId: validBody.variantId,
            sessionId: validBody.sessionId,
            eventType: 'clicks',
            value: 10
          }),
          expect.objectContaining({
            testId: validBody.testId,
            variantId: validBody.variantId,
            sessionId: validBody.sessionId,
            eventType: 'conversions',
            value: 2
          })
        ])
      });
    });

    it('should handle database errors', async () => {
      const validBody = {
        testId: 'test-1',
        variantId: 'variant-a',
        sessionId: 'session-1',
        metrics: {
          impressions: 100,
          clicks: 10,
          conversions: 2
        }
      };

      vi.mocked(prisma.aBTest.findFirst).mockResolvedValue({
        id: 'test-1',
        status: 'ACTIVE',
        name: 'Test Experiment',
        description: 'Test description',
        startDate: new Date(),
        endDate: new Date(),
        configuration: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(prisma.aBTestMetric.createMany).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/nous/ab-testing/results');
      request.json = vi.fn().mockResolvedValue(validBody);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record metrics');
      expect(logger.error).toHaveBeenCalledWith('Failed to record metrics', {
        error: expect.any(Error),
        errorType: 'Error',
        message: 'Database error'
      });
    });
  });

  describe('GET /api/nous/ab-testing/results', () => {
    it('should return aggregated metrics', async () => {
      const mockMetrics = [
        {
          id: 'metric-1',
          testId: 'test-1',
          variantId: 'variant-a',
          sessionId: 'session-1',
          eventType: 'impressions',
          value: 100,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'metric-2',
          testId: 'test-1',
          variantId: 'variant-a',
          sessionId: 'session-1',
          eventType: 'clicks',
          value: 10,
          timestamp: new Date(),
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(prisma.aBTestMetric.findMany).mockResolvedValue(mockMetrics);

      const request = new NextRequest('http://localhost/api/nous/ab-testing/results?testId=test-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        testId: 'test-1',
        metrics: {
          'variant-a': {
            impressions: [100],
            clicks: [10]
          }
        }
      });
      expect(prisma.aBTestMetric.findMany).toHaveBeenCalledWith({
        where: { testId: 'test-1' },
        orderBy: { timestamp: 'desc' }
      });
    });

    it('should handle missing testId parameter', async () => {
      const request = new NextRequest('http://localhost/api/nous/ab-testing/results');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing testId parameter');
    });

    it('should handle database errors during fetch', async () => {
      vi.mocked(prisma.aBTestMetric.findMany).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/nous/ab-testing/results?testId=test-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch metrics');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch metrics', {
        error: expect.any(Error)
      });
    });
  });
});
