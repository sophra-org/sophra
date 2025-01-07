import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from "~/vitest.setup";
import { POST } from './route';
import { NextRequest } from 'next/server';
import type { AdaptationSuggestion } from '@prisma/client';

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

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

      vi.mocked(mockPrisma.adaptationSuggestion.findMany).mockResolvedValue(mockSuggestion);

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });

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

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest', {
        method: 'POST',
        body: JSON.stringify(invalidPayload)
      });

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

      vi.mocked(mockPrisma.adaptationSuggestion.findMany).mockRejectedValue(new Error('DB Error'));

      const request = new NextRequest('http://localhost:3000/api/nous/adapt/suggest', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get adaptation suggestions');
    });
  });
});
