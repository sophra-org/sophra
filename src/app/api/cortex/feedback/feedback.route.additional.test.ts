import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, SignalType, EngagementType } from './route';
import { serviceManager } from '@lib/cortex/utils/service-manager';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';
import { NextRequest, NextResponse } from 'next/server';
import { JsonValue } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('@lib/cortex/utils/service-manager', () => ({
  serviceManager: {
    getServices: vi.fn(),
  },
}));

vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    feedbackRequest: {
      findMany: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
    },
    searchEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('Feedback Route Additional Tests', () => {
  describe('GET Endpoint', () => {
    const mockFeedback = [
      {
        id: 'feedback-1',
        timestamp: new Date(),
        feedback: {
          rating: 0.8,
          metadata: { userAction: SignalType.USER_BEHAVIOR_CLICK },
        } as JsonValue,
      },
    ];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch feedback with default parameters', async () => {
      const url = new URL('http://localhost/api/feedback');
      const request = new NextRequest(url);
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockFeedback);
      expect(data.metadata).toEqual(
        expect.objectContaining({
          timeframe: '24h',
          total_records: 1,
        })
      );
    });

    it('should handle custom timeframe and limit', async () => {
      const url = new URL('http://localhost/api/feedback?timeframe=7d&limit=50');
      const request = new NextRequest(url);
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue(mockFeedback);

      const response = await GET(request);
      const data = await response.json();

      expect(prisma.feedbackRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          where: {
            timestamp: {
              gte: expect.any(Date),
            },
          },
        })
      );
      expect(data.metadata.timeframe).toBe('7d');
    });

    it('should handle database errors', async () => {
      const url = new URL('http://localhost/api/feedback');
      const request = new NextRequest(url);
      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch feedback');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch feedback',
        expect.any(Object)
      );
    });
  });

  describe('POST Endpoint', () => {
    const mockServices = {
      feedback: {
        recordFeedbackWithOptimization: vi.fn(),
      },
    };

    const validPayload = {
      sessionId: 'test-session',
      feedback: [
        {
          queryId: 'query-1',
          rating: 0.8,
          metadata: {
            userAction: SignalType.USER_BEHAVIOR_CLICK,
            resultId: 'result-1',
            queryHash: 'hash-1',
            timestamp: new Date().toISOString(),
            engagementType: EngagementType.CLICK,
            customMetadata: {
              source: 'test',
            },
          },
        },
      ],
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(serviceManager.getServices).mockResolvedValue(mockServices as any);
    });

    it('should process valid feedback successfully', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'test-session',
      } as any);

      vi.mocked(prisma.searchEvent.create).mockResolvedValue({
        id: 'search-1',
      } as any);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(
        expect.objectContaining({
          feedbackCount: 1,
          feedback: expect.arrayContaining([
            expect.objectContaining({
              queryId: 'query-1',
              rating: 0.8,
            }),
          ]),
        })
      );
    });

    it('should validate request body', async () => {
      const invalidPayload = {
        sessionId: 'test-session',
        feedback: [
          {
            queryId: 'query-1',
            rating: 2, // Invalid rating > 1
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: 'result-1',
              queryHash: 'hash-1',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };

      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });

    it('should handle missing session', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid session');
    });

    it('should handle database errors', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'test-session',
      } as any);

      vi.mocked(prisma.searchEvent.create).mockRejectedValue(
        new Error('Database error')
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record feedback');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });

    it('should handle feedback service errors', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'test-session',
      } as any);

      vi.mocked(prisma.searchEvent.create).mockResolvedValue({
        id: 'search-1',
      } as any);

      vi.mocked(mockServices.feedback.recordFeedbackWithOptimization).mockRejectedValue(
        new Error('Feedback processing error')
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record feedback');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });

    it('should handle missing feedback service', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      vi.mocked(serviceManager.getServices).mockResolvedValue({} as any);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record feedback');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record feedback');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });
  });
});
