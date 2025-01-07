import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock modules before importing them
vi.mock('@/lib/shared/database/client', () => ({
  default: {
    aBTest: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn()
    }
  }
}));

vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@prisma/client', () => ({
  ExperimentStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
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

// Import mocked modules after mocking
import prisma from "@/lib/shared/database/client";
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";

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
          status: ExperimentStatus.ACTIVE,
          description: 'Test description 1',
          startDate: new Date(),
          endDate: null,
          configuration: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-2',
          name: 'Test Experiment 2',
          status: ExperimentStatus.PENDING,
          description: 'Test description 2',
          startDate: null,
          endDate: null,
          configuration: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(prisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(prisma.aBTest.count).mockResolvedValue(2);

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
      expect(prisma.aBTest.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(prisma.aBTest.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle pagination parameters', async () => {
      const mockExperiments = [
        {
          id: 'test-3',
          name: 'Test Experiment 3',
          status: ExperimentStatus.ACTIVE,
          description: 'Test description 3',
          startDate: new Date(),
          endDate: null,
          configuration: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(prisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(prisma.aBTest.count).mockResolvedValue(15);

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
      expect(prisma.aBTest.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      expect(prisma.aBTest.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle status filter', async () => {
      const mockExperiments = [
        {
          id: 'test-1',
          name: 'Test Experiment 1',
          status: ExperimentStatus.ACTIVE,
          description: 'Test description 1',
          startDate: new Date(),
          endDate: null,
          configuration: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      vi.mocked(prisma.aBTest.findMany).mockResolvedValue(mockExperiments);
      vi.mocked(prisma.aBTest.count).mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments?status=ACTIVE');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockExperiments);
      expect(prisma.aBTest.findMany).toHaveBeenCalledWith({
        where: { status: ExperimentStatus.ACTIVE },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      expect(prisma.aBTest.count).toHaveBeenCalledWith({ 
        where: { status: ExperimentStatus.ACTIVE } 
      });
    });

    it('should handle database errors', async () => {
      vi.mocked(prisma.aBTest.findMany).mockRejectedValue(new Error('Database error'));

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
        status: ExperimentStatus.PENDING,
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const request = new NextRequest('http://localhost/api/nous/ab-testing/experiments');
      request.json = vi.fn().mockResolvedValue(newExperiment);
      vi.mocked(prisma.aBTest.create).mockResolvedValue(mockCreatedExperiment);

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
      vi.mocked(prisma.aBTest.create).mockRejectedValue(new Error('Database error'));

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
