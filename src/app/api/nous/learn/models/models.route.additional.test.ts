import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { prisma } from '@lib/shared/database/client';
import logger from '@lib/shared/logger';
import { ModelType, Prisma } from '@prisma/client';

// Mock dependencies
vi.mock('@lib/shared/database/client', () => ({
  prisma: {
    modelConfig: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Learning Models API Additional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockModel = (id: string) => ({
    id,
    type: ModelType.SEARCH_RANKER,
    hyperparameters: { layers: 3, units: 64 },
    features: ['feature1', 'feature2'],
    trainingParams: { epochs: 100, batchSize: 32 },
    modelVersions: [
      {
        id: `version-${id}`,
        metrics: {},
        artifactPath: '',
        parentVersion: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('GET Endpoint', () => {
    it('should retrieve models with latest version', async () => {
      const mockModels = [
        createMockModel('model-1'),
        createMockModel('model-2'),
      ];
      vi.mocked(prisma.modelConfig.findMany).mockResolvedValue(mockModels);

      const request = new NextRequest('http://localhost/api/learn/models');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toEqual(
        expect.objectContaining({
          id: 'model-1',
          type: ModelType.SEARCH_RANKER,
          modelVersions: expect.arrayContaining([
            expect.objectContaining({
              id: 'version-model-1',
            }),
          ]),
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.modelConfig.findMany).mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/learn/models');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.modelConfig.findMany).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost/api/learn/models');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch models');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch models',
        expect.any(Object)
      );
    });

    it('should include timing information', async () => {
      const mockModels = [createMockModel('model-1')];
      vi.mocked(prisma.modelConfig.findMany).mockResolvedValue(mockModels);

      const request = new NextRequest('http://localhost/api/learn/models');
      const response = await GET(request);
      const data = await response.json();

      expect(data.meta).toEqual(
        expect.objectContaining({
          total: 1,
          page: 1,
          pageSize: 10,
        })
      );
    });
  });

  describe('POST Endpoint', () => {
    const validRequest = {
      type: ModelType.SEARCH_RANKER,
      hyperparameters: { layers: 3, units: 64 },
      features: ['feature1', 'feature2'],
      trainingParams: { epochs: 100, batchSize: 32 },
    };

    it('should create model with initial version', async () => {
      const mockModel = createMockModel('model-1');
      vi.mocked(prisma.modelConfig.create).mockResolvedValue(mockModel);

      const request = new NextRequest('http://localhost/api/learn/models', {
        method: 'POST',
        body: JSON.stringify(validRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(
        expect.objectContaining({
          id: mockModel.id,
          type: mockModel.type,
          isTrained: false,
          trainingProgress: 0,
        })
      );
      expect(prisma.modelConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: ModelType.SEARCH_RANKER,
            modelVersions: expect.objectContaining({
              create: expect.any(Object),
            }),
          }),
        })
      );
    });

    describe('Request Validation', () => {
      it('should validate model type', async () => {
        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify({
            ...validRequest,
            type: 'INVALID_TYPE',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid request format');
      });

      it('should validate required fields', async () => {
        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
            type: ModelType.SEARCH_RANKER,
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should handle invalid JSON', async () => {
        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors', async () => {
        vi.mocked(prisma.modelConfig.create).mockRejectedValue(
          new Error('Database error')
        );

        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to create model');
        expect(logger.error).toHaveBeenCalledWith(
          'Failed to create model',
          expect.any(Object)
        );
      });

      it('should include timing information in error response', async () => {
        vi.mocked(prisma.modelConfig.create).mockRejectedValue(
          new Error('Database error')
        );

        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.meta).toEqual(
          expect.objectContaining({
            took: expect.any(Number),
          })
        );
      });
    });

    describe('Response Formatting', () => {
      it('should format successful response correctly', async () => {
        const mockModel = createMockModel('model-1');
        vi.mocked(prisma.modelConfig.create).mockResolvedValue(mockModel);

        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.data).toEqual(
          expect.objectContaining({
            id: mockModel.id,
            type: mockModel.type,
            isTrained: false,
            trainingProgress: 0,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          })
        );
      });

      it('should handle missing version information', async () => {
        const mockModel = {
          ...createMockModel('model-1'),
          modelVersions: [], // Empty versions array
        };
        vi.mocked(prisma.modelConfig.create).mockResolvedValue(mockModel);

        const request = new NextRequest('http://localhost/api/learn/models', {
          method: 'POST',
          body: JSON.stringify(validRequest),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.data.createdAt).toBeDefined();
        expect(data.data.updatedAt).toBeDefined();
      });
    });
  });
});
