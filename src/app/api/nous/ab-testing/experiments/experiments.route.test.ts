import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";
import { mockPrisma } from "~/vitest.setup";

vi.mock('@/lib/shared/logger', () => ({
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

describe('Experiments Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/nous/ab-testing/experiments', () => {
    it('should return experiments with default pagination', async () => {
      const mockExperiments = [
        {
          id: 'test-1',
          name: 'Test Experiment 1',
          status: 'ACTIVE' as const,
          description: 'Test description',
          startDate: new Date(),
          endDate: new Date(),
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-2',
          name: 'Test Experiment 2',
          status: 'PENDING' as const,
          description: 'Test description 2',
          startDate: new Date(),
          endDate: new Date(),
          configuration: {
            variants: ['A', 'B'],
            distribution: [0.5, 0.5]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(mockPrisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(mockPrisma.aBTest.count).mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExperiments);
      expect(data.metadata).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        hasMore: false
      });
      expect(mockPrisma.aBTest.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(mockPrisma.aBTest.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle pagination parameters', async () => {
      const mockExperiments = [
        {
          id: 'test-3',
          name: 'Test Experiment 3',
          status: 'ACTIVE' as const,
          description: 'Test description 3',
          startDate: new Date(),
          endDate: new Date(),
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(mockPrisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(mockPrisma.aBTest.count).mockResolvedValue(15);

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments?page=2&limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExperiments);
      expect(data.metadata).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        hasMore: true
      });
      expect(mockPrisma.aBTest.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      expect(mockPrisma.aBTest.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle status filter', async () => {
      const mockExperiments = [
        {
          id: 'test-1',
          name: 'Test Experiment 1',
          status: 'ACTIVE' as const,
          description: 'Test description 1',
          startDate: new Date(),
          endDate: new Date(),
          configuration: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(mockPrisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(mockPrisma.aBTest.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments?status=ACTIVE');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExperiments);
      expect(mockPrisma.aBTest.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(mockPrisma.aBTest.count).toHaveBeenCalledWith({ 
        where: { status: 'ACTIVE' } 
      });
    });

    it('should handle database errors', async () => {
      vi.mocked(mockPrisma.aBTest.findMany).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch experiments');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch experiments', {
        error: expect.any(Error)
      });
    });
  });

  describe('POST /api/nous/ab-testing/experiments', () => {
    it('should create a new experiment', async () => {
      const newExperiment = {
        name: 'New Test Experiment',
        description: 'New test description',
        configuration: {
          variants: ['A', 'B'],
          distribution: [0.5, 0.5]
        }
      };

      const mockCreatedExperiment = {
        id: 'new-test-1',
        ...newExperiment,
        status: 'PENDING' as const,
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      request.json = vi.fn().mockResolvedValue(newExperiment);
      vi.mocked(mockPrisma.aBTest.create).mockResolvedValue(mockCreatedExperiment);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedExperiment);
      expect(logger.info).toHaveBeenCalledWith('Created new experiment', {
        experimentId: mockCreatedExperiment.id,
        name: mockCreatedExperiment.name
      });
    });

    it('should return 400 for invalid experiment data', async () => {
      const invalidExperiment = {
        description: 'Missing name'
      };

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      request.json = vi.fn().mockResolvedValue(invalidExperiment);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid experiment data');
    });

    it('should handle database errors during creation', async () => {
      const newExperiment = {
        name: 'New Test Experiment',
        description: 'New test description',
        configuration: {
          variants: ['A', 'B'],
          distribution: [0.5, 0.5]
        }
      };

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      request.json = vi.fn().mockResolvedValue(newExperiment);
      vi.mocked(mockPrisma.aBTest.create).mockRejectedValue(new Error('Database error'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create experiment');
      expect(logger.error).toHaveBeenCalledWith('Failed to create experiment', {
        error: expect.any(Error)
      });
    });
  });
});
