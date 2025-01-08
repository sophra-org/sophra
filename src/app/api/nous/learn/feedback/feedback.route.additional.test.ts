import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, runtime } from './route';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';
import { NextRequest } from 'next/server';
import { SignalType, EngagementType } from '@prisma/client';

// Mock dependencies
vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    feedbackRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Feedback Route Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use Node.js runtime', () => {
      expect(runtime).toBe('nodejs');
    });
  });

  describe('GET Endpoint', () => {
    const mockFeedback = {
      id: 'feedback-1',
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
          },
        },
        {
          queryId: 'query-2',
          rating: 0.6,
          metadata: {
            userAction: SignalType.USER_BEHAVIOR_VIEW,
            resultId: 'result-2',
            queryHash: 'hash-2',
            timestamp: new Date().toISOString(),
            engagementType: EngagementType.VIEW,
          },
        },
      ],
      timestamp: new Date(),
    };

    it('should retrieve and format feedback', async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([mockFeedback]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [
          {
            id: mockFeedback.id,
            content: expect.arrayContaining([
              expect.objectContaining({
                queryId: 'query-1',
                rating: 0.8,
              }),
              expect.objectContaining({
                queryId: 'query-2',
                rating: 0.6,
              }),
            ]),
            createdAt: expect.any(String),
            metrics: {
              averageRating: 0.7,
              totalFeedback: 2,
              uniqueUsers: 2,
            },
          },
        ],
        meta: {
          total: 1,
        },
      });
    });

    it('should handle empty feedback list', async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [],
        meta: {
          total: 0,
        },
      });
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.feedbackRequest.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to fetch feedback',
        meta: {
          total: 0,
        },
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch feedback',
        expect.any(Object)
      );
    });

    it('should calculate metrics correctly', async () => {
      const feedbackWithDuplicateUser = {
        ...mockFeedback,
        feedback: [
          ...mockFeedback.feedback,
          {
            queryId: 'query-1', // Duplicate user
            rating: 0.9,
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: 'result-3',
              queryHash: 'hash-3',
              timestamp: new Date().toISOString(),
              engagementType: EngagementType.CLICK,
            },
          },
        ],
      };

      vi.mocked(prisma.feedbackRequest.findMany).mockResolvedValue([
        feedbackWithDuplicateUser,
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.data[0].metrics).toEqual({
        averageRating: (0.8 + 0.6 + 0.9) / 3,
        totalFeedback: 3,
        uniqueUsers: 2, // Should count unique queryIds
      });
    });
  });

  describe('POST Endpoint', () => {
    const validFeedback = {
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
          },
        },
      ],
    };

    it('should process valid feedback', async () => {
      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: JSON.stringify(validFeedback),
      });

      const mockCreatedFeedback = {
        id: 'feedback-1',
        ...validFeedback,
        timestamp: new Date(),
      };

      vi.mocked(prisma.feedbackRequest.create).mockResolvedValue(mockCreatedFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: {
          id: 'feedback-1',
          feedback: validFeedback.feedback,
          timestamp: expect.any(String),
          meta: {
            uniqueQueries: 1,
            averageRating: 0.8,
            feedbackCount: 1,
          },
        },
        meta: {
          total: 1,
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Recorded feedback',
        expect.objectContaining({
          feedbackCount: 1,
          timestamp: expect.any(String),
        })
      );
    });

    it('should validate request schema', async () => {
      const invalidFeedback = {
        feedback: [
          {
            queryId: 'query-1',
            rating: 2, // Invalid: > 1
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: 'result-1',
              queryHash: 'hash-1',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };

      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidFeedback),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: 'Invalid request format',
        details: expect.any(Object),
        meta: {
          total: 0,
        },
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Invalid feedback request',
        expect.any(Object)
      );
    });

    it('should handle database errors', async () => {
      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: JSON.stringify(validFeedback),
      });

      vi.mocked(prisma.feedbackRequest.create).mockRejectedValue(
        new Error('Database error')
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: 'Failed to record feedback',
        meta: {
          total: 0,
        },
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to record feedback',
        expect.any(Object)
      );
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: 'invalid-json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to record feedback');
    });

    it('should validate feedback array', async () => {
      const emptyFeedback = {
        feedback: [],
      };

      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: JSON.stringify(emptyFeedback),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });

    it('should handle optional metadata fields', async () => {
      const feedbackWithOptionalFields = {
        feedback: [
          {
            queryId: 'query-1',
            rating: 0.8,
            metadata: {
              userAction: SignalType.USER_BEHAVIOR_CLICK,
              resultId: 'result-1',
              queryHash: 'hash-1',
              timestamp: new Date().toISOString(),
              // engagementType is optional
              customMetadata: {
                source: 'test',
              },
            },
          },
        ],
      };

      const request = new NextRequest('http://localhost/api/learn/feedback', {
        method: 'POST',
        body: JSON.stringify(feedbackWithOptionalFields),
      });

      const mockCreatedFeedback = {
        id: 'feedback-1',
        ...feedbackWithOptionalFields,
        timestamp: new Date(),
      };

      vi.mocked(prisma.feedbackRequest.create).mockResolvedValue(mockCreatedFeedback);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });
  });
});
