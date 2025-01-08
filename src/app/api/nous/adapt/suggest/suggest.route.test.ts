import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import logger from '@lib/shared/logger';
import type { AdaptationSuggestion } from '@prisma/client';

// Mock modules
vi.mock('@lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn()
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

vi.mock('@lib/shared/database/client', () => {
  const mockPrisma = {
    adaptationSuggestion: {
      findMany: vi.fn(),
      create: vi.fn()
    }
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '@lib/shared/database/client';
import { POST } from './route';

describe('Adaptation Suggestions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/nous/adapt/suggest', () => {
    it('should return suggestions for valid query', async () => {
      const validPayload = {
        queryHash: "hash123",
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9
        },
        confidence: 0.95
      } as const;

      const mockSuggestion = [{
        id: "1",
        queryHash: validPayload.queryHash,
        patterns: validPayload.patterns,
        confidence: validPayload.confidence,
        status: 'PENDING',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }] satisfies AdaptationSuggestion[];

      vi.mocked(prisma.adaptationSuggestion.findMany).mockResolvedValue(mockSuggestion);

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest');
      request.json = vi.fn().mockResolvedValue(validPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSuggestion);
    });

    it('should reject invalid request format', async () => {
      const invalidPayload = {
        // Missing required fields
        queryHash: "hash123"
      };

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest');
      request.json = vi.fn().mockResolvedValue(invalidPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request format');
    });

    it('should handle database errors', async () => {
      const validPayload = {
        queryHash: "hash123",
        patterns: {
          averageRelevance: 0.8,
          clickThroughRate: 0.6,
          conversionRate: 0.4,
          requiresOptimization: true,
          confidence: 0.9
        },
        confidence: 0.95
      };

      vi.mocked(prisma.adaptationSuggestion.findMany).mockRejectedValue(new Error('DB Error'));

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest');
      request.json = vi.fn().mockResolvedValue(validPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get adaptation suggestions');
    });
  });
});
