import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import logger from '../../../../../../lib/shared/logger';
import { ExperimentStatus, Prisma } from '@prisma/client';

// Mock modules
vi.mock('../../../../../../lib/shared/logger', () => ({
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

vi.mock('@prisma/client', () => ({
  ExperimentStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    STOPPED: 'STOPPED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  }
}));

vi.mock('../../../../../../lib/shared/database/client', () => {
  const mockPrisma = {
    aBTest: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  };
  return { prisma: mockPrisma };
});

// Import after mocks
import { prisma } from '../../../../../../lib/shared/database/client';
import { POST } from './route';

describe('Experiment Deactivation Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deactivate an active experiment', async () => {
    const mockExperiment = {
      id: 'test-experiment',
      name: 'Test Experiment',
      status: ExperimentStatus.ACTIVE,
      description: 'Test description',
      startDate: new Date(),
      endDate: new Date(),
      configuration: {
        variants: ['A', 'B'],
        distribution: [0.5, 0.5]
      } as Prisma.JsonValue,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(mockExperiment);
    vi.mocked(prisma.aBTest.update).mockResolvedValue({
      ...mockExperiment,
      status: ExperimentStatus.STOPPED,
      endDate: expect.any(Date)
    });

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate');
    request.json = vi.fn().mockResolvedValue({ experimentId: mockExperiment.id });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe(ExperimentStatus.STOPPED);
    expect(data.data.endDate).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith('Deactivated experiment', {
      experimentId: mockExperiment.id,
      name: mockExperiment.name
    });
  });

  it('should handle non-existent experiment', async () => {
    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'non-existent' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment not found');
  });

  it('should handle already stopped experiment', async () => {
    const mockExperiment = {
      id: 'test-experiment',
      name: 'Test Experiment',
      status: ExperimentStatus.STOPPED,
      description: 'Test description',
      startDate: new Date(),
      endDate: new Date(),
      configuration: {
        variants: ['A', 'B'],
        distribution: [0.5, 0.5]
      } as Prisma.JsonValue,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(mockExperiment);

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate');
    request.json = vi.fn().mockResolvedValue({ experimentId: mockExperiment.id });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment is already stopped');
  });

  it('should handle database errors', async () => {
    vi.mocked(prisma.aBTest.findUnique).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'test-experiment' });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to deactivate experiment');
    expect(logger.error).toHaveBeenCalledWith('Failed to deactivate experiment', {
      error: expect.any(Error)
    });
  });
});
