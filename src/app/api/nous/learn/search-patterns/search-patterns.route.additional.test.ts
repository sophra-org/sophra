import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelType } from '@prisma/client';
import type { PrismaClient, Prisma } from '@prisma/client';

// Mock modules must be defined before any imports that use them
vi.mock('@lib/shared/database/client', () => {
  const mockPrisma = {
    modelState: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation((arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.resolve(arg.map(() => ({} as Prisma.ModelStateCreateArgs)));
      }
      return Promise.resolve([]);
    }),
  };
  return { prisma: mockPrisma };
});

vi.mock('@lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';

interface MockMetricsCreate {
  accuracy: number;
  validationMetrics: {
    pattern_confidence: number;
    searchType: string;
    adaptationRulesApplied: number;
  };
}

interface MockCreateCall {
  data: {
    metrics: {
      create: MockMetricsCreate;
    };
  };
}

describe('Search Patterns API Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockPattern = (id: string) => {
    const now = new Date();
    return {
      id,
      modelType: ModelType.PATTERN_DETECTOR,
      featureNames: ['test-query'],
      versionId: `pattern_${id}`,
      weights: [0],
      bias: 0,
      scaler: {},
      isTrained: true,
      hyperparameters: {},
      currentEpoch: 0,
      trainingProgress: 1,
      lastTrainingError: null,
      metrics: [
        {
          id: `metrics_${id}`,
          modelVersionId: `metrics_${id}`,
          accuracy: 0.85,
          precision: 0,
          recall: 0,
          f1Score: 0,
          latencyMs: 100,
          loss: 0,
          validationMetrics: {
            pattern_confidence: 0.8,
            searchType: 'semantic',
            adaptationRulesApplied: 2,
          },
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  };

  describe('GET Endpoint', () => {
    it('should handle query parameter', async () => {
      const mockPatterns = [createMockPattern('pattern-1')];
      vi.mocked(prisma.modelState.findMany).mockResolvedValue(mockPatterns);

      const request = new NextRequest(
        'http://localhost/api/learn/search-patterns?query=test-query'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(prisma.modelState.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { featureNames: { hasSome: ['test-query'] } },
            ]),
          }),
        })
      );
    });

    it('should handle pagination parameters', async () => {
      const mockPatterns = Array(5)
        .fill(null)
        .map((_, i) => createMockPattern(`pattern-${i}`));
      vi.mocked(prisma.modelState.findMany).mockResolvedValue(mockPatterns);

      const request = new NextRequest(
        'http://localhost/api/learn/search-patterns?limit=5&offset=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metadata).toEqual(
        expect.objectContaining({
          limit: 5,
          offset: 10,
        })
      );
      expect(prisma.modelState.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10,
        })
      );
    });

    it('should enforce pagination limits', async () => {
      const request = new NextRequest(
        'http://localhost/api/learn/search-patterns?limit=200'
      );
      await GET(request);

      expect(prisma.modelState.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Max limit
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.modelState.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/learn/search-patterns');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.metadata.count).toBe(0);
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.modelState.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/learn/search-patterns');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to search patterns');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to search patterns',
        expect.any(Object)
      );
    });
  });

  describe('POST Endpoint', () => {
    const validPattern = {
      query: 'test-query',
      timestamp: new Date().toISOString(),
      metadata: {
        relevantHits: 8,
        totalHits: 10,
        took: 100,
        adaptationRulesApplied: 2,
        searchType: 'semantic',
        facetsUsed: true,
        source: 'test',
      },
    };

    it('should create patterns successfully', async () => {
      const mockPattern = createMockPattern('pattern-1');
      vi.mocked(prisma.$transaction).mockResolvedValue([mockPattern]);

      const request = new NextRequest('http://localhost/api/learn/search-patterns', {
        method: 'POST',
        body: JSON.stringify({
          patterns: [validPattern],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        ...mockPattern,
        createdAt: mockPattern.createdAt.toISOString(),
        updatedAt: mockPattern.updatedAt.toISOString(),
        metrics: [{
          ...mockPattern.metrics[0],
          timestamp: mockPattern.metrics[0].timestamp.toISOString()
        }]
      });
      expect(data.metadata).toEqual(
        expect.objectContaining({
          processedCount: 1,
          processingTime: expect.any(Number),
        })
      );
    });

    describe('Request Validation', () => {
      it('should validate pattern format', async () => {
        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [
              {
                // Missing required fields
                query: 'test-query',
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid request format');
      });

      it('should validate metadata fields', async () => {
        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [
              {
                ...validPattern,
                metadata: {
                  // Invalid metadata
                  invalidField: 'test',
                },
              },
            ],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should handle invalid JSON', async () => {
        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('Pattern Processing', () => {
      it('should calculate metrics correctly', async () => {
        const mockPattern = createMockPattern('pattern-1');
        const mockCreateOperation: MockCreateCall = {
          data: {
            metrics: {
              create: {
                accuracy: 0.8,
                validationMetrics: {
                  pattern_confidence: 0.8,
                  searchType: 'exact',
                  adaptationRulesApplied: 1
                }
              }
            }
          }
        };
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockPattern]);
        vi.mocked(prisma.modelState.create).mockReturnValue(mockCreateOperation as any);

        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [validPattern],
          }),
        });

        await POST(request);

        const createOperation = vi.mocked(prisma.modelState.create).mock.calls[0][0] as unknown as MockCreateCall;

        expect(createOperation.data.metrics.create).toEqual(
          expect.objectContaining({
            accuracy: 0.8, // 8/10
            validationMetrics: expect.objectContaining({
              pattern_confidence: 0.8, // Has adaptation rules
            }),
          })
        );
      });

      it('should handle missing metrics gracefully', async () => {
        const patternWithoutMetrics = {
          ...validPattern,
          metadata: {
            ...validPattern.metadata,
            relevantHits: undefined,
            totalHits: undefined,
          },
        };

        const mockPattern = createMockPattern('pattern-1');
        const mockCreateOperation: MockCreateCall = {
          data: {
            metrics: {
              create: {
                accuracy: 0,
                validationMetrics: {
                  pattern_confidence: 0.6,
                  searchType: 'exact',
                  adaptationRulesApplied: 0
                }
              }
            }
          }
        };
        vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockPattern]);
        vi.mocked(prisma.modelState.create).mockReturnValue(mockCreateOperation as any);

        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [patternWithoutMetrics],
          }),
        });

        await POST(request);

        const createOperation = vi.mocked(prisma.modelState.create).mock.calls[0][0] as unknown as MockCreateCall;

        expect(createOperation.data.metrics.create.accuracy).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors', async () => {
        vi.mocked(prisma.$transaction).mockRejectedValue(
          new Error('Database error')
        );

        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [validPattern],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to store patterns');
        expect(logger.error).toHaveBeenCalledWith(
          'Database operation failed',
          expect.any(Object)
        );
      });

      it('should include error details in response', async () => {
        const error = new Error('Custom error message');
        vi.mocked(prisma.$transaction).mockRejectedValue(error);

        const request = new NextRequest('http://localhost/api/learn/search-patterns', {
          method: 'POST',
          body: JSON.stringify({
            patterns: [validPattern],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.details).toEqual(
          expect.objectContaining({
            message: 'Custom error message',
            timestamp: expect.any(String),
            patternCount: 1,
          })
        );
      });
    });
  });
});
