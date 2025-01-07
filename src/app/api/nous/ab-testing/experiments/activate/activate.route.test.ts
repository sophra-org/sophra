import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import logger from "@/lib/shared/logger";
import { NextRequest, NextResponse } from 'next/server';

// Mock ExperimentStatus enum
const ExperimentStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

vi.mock('@prisma/client', () => ({
  ExperimentStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
  }
}));

vi.mock('@/lib/shared/database/client', () => ({
  default: {
    aBTest: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

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

describe('Activate Experiment Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when request body is invalid', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request format');
  });

  it('should return 404 when experiment is not found', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'test-id' });
    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(null);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment not found');
  });

  it('should return 400 when experiment is already active', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'test-id' });
    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue({
      id: 'test-id',
      status: 'ACTIVE',
      name: 'Test Experiment',
      description: null,
      startDate: new Date(),
      endDate: new Date(),
      configuration: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment is already active');
  });

  it('should successfully activate an experiment', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'test-id' });

    const mockExperiment = {
      id: 'test-id',
      status: ExperimentStatus.PENDING,
      name: 'Test Experiment',
      description: null,
      startDate: new Date(),
      endDate: new Date(),
      configuration: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(mockExperiment);
    vi.mocked(prisma.aBTest.update).mockResolvedValue({
      ...mockExperiment,
      status: ExperimentStatus.ACTIVE
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ACTIVE');
    expect(logger.info).toHaveBeenCalledWith('Activated experiment', {
      experimentId: 'test-id',
      name: 'Test Experiment'
    });
  });

  it('should return 500 when database operation fails', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({ experimentId: 'test-id' });
    vi.mocked(prisma.aBTest.findUnique).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to activate experiment');
    expect(logger.error).toHaveBeenCalled();
  });
});
