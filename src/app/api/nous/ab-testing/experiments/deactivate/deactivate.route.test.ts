import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma } from "~/vitest.setup";
import { POST } from './route';
import { NextRequest } from 'next/server';
import { ExperimentStatus, type Prisma } from '@prisma/client';

// Extend mockPrisma type
const extendedMockPrisma = {
  ...mockPrisma,
  experiment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  }
};

// Mock modules before importing them
vi.mock('@/lib/shared/database/client', () => ({
  default: extendedMockPrisma
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
    COMPLETED: 'COMPLETED',
    STOPPED: 'STOPPED',
    FAILED: 'FAILED',
  }
}));

describe('Experiment Deactivation Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deactivate an active experiment', async () => {
    const mockExperiment = {
      id: 'test-experiment',
      status: ExperimentStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies Partial<Prisma.ExperimentConfigCreateInput>;

    vi.mocked(extendedMockPrisma.experiment.findUnique).mockResolvedValue(mockExperiment as any);
    vi.mocked(extendedMockPrisma.experiment.update).mockResolvedValue({
      ...mockExperiment,
      status: ExperimentStatus.STOPPED,
      endDate: expect.any(Date),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate', {
      method: 'POST',
      body: JSON.stringify({ experimentId: mockExperiment.id }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe(ExperimentStatus.STOPPED);
    expect(data.data.endDate).toBeDefined();
  });

  it('should handle non-existent experiment', async () => {
    vi.mocked(extendedMockPrisma.experiment.findUnique).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate', {
      method: 'POST',
      body: JSON.stringify({ experimentId: 'non-existent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment not found');
  });

  it('should handle database errors', async () => {
    vi.mocked(extendedMockPrisma.experiment.findUnique).mockRejectedValue(new Error('DB Error'));

    const request = new NextRequest('http://localhost:3000/api/nous/ab-testing/experiments/deactivate', {
      method: 'POST',
      body: JSON.stringify({ experimentId: 'test-experiment' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to deactivate experiment');
  });
});
