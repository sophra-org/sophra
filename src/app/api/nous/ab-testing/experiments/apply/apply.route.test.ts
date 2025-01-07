import { mockPrisma } from '@/lib/shared/test/prisma.mock';

// Mock Prisma before other imports
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  ExperimentStatus: {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE'
  }
}));

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma,
  prisma: mockPrisma
}));

// Regular imports after mocking
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import logger from "@/lib/shared/logger";
import { ExperimentStatus } from "@prisma/client";

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

describe('Apply Adaptation Route Handler', () => {
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
    request.json = vi.fn().mockResolvedValue({
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1',
        metrics: {
          conversionRate: 0.1,
          bounceRate: 0.5
        }
      }
    });

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue(null);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment not found');
    expect(logger.info).toHaveBeenCalledWith('Experiment not found', {
      experimentId: 'test-id'
    });
  });

  it('should return 400 when experiment is not active', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1',
        metrics: {
          conversionRate: 0.1,
          bounceRate: 0.5
        }
      }
    });

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue({
      id: 'test-id',
      name: 'Test Experiment',
      status: ExperimentStatus.PENDING,
      description: 'Test description',
      startDate: new Date(),
      endDate: new Date(), // Changed from null to new Date() to fix type error
      configuration: {
        variants: ['A', 'B'],
        distribution: [0.5, 0.5],
        adaptationRules: ['rule-1', 'rule-2']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Experiment is not active');
    expect(logger.info).toHaveBeenCalledWith('Experiment is not active', {
      experimentId: 'test-id',
      status: ExperimentStatus.PENDING
    });
  });

  it('should successfully apply adaptations', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1',
        metrics: {
          conversionRate: 0.1,
          bounceRate: 0.5
        }
      }
    });

    const mockExperiment = {
      id: 'test-id',
      name: 'Test Experiment',
      status: ExperimentStatus.ACTIVE,
      description: 'Test description',
      startDate: new Date(),
      endDate: null,
      configuration: {
        variants: ['A', 'B'],
        distribution: [0.5, 0.5],
        adaptationRules: ['rule-1', 'rule-2']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockRules = [
      {
        id: 'rule-1',
        name: 'High Bounce Rate Rule',
        condition: {
          metric: 'bounceRate',
          operator: '>',
          value: 0.4
        },
        action: {
          type: 'ADJUST_DISTRIBUTION',
          parameters: {
            variant: 'A',
            adjustment: -0.1
          }
        }
      },
      {
        id: 'rule-2',
        name: 'Low Conversion Rate Rule',
        condition: {
          metric: 'conversionRate',
          operator: '<',
          value: 0.2
        },
        action: {
          type: 'ADJUST_DISTRIBUTION',
          parameters: {
            variant: 'B',
            adjustment: 0.1
          }
        }
      }
    ];

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue({
      ...mockExperiment,
      endDate: new Date()
    });
    vi.mocked(prisma.adaptationRule.findMany).mockResolvedValue(mockRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      type: 'ADAPTATION_RULE',
      description: '',
      conditions: rule.condition,
      actions: rule.action,
      priority: 'MEDIUM',
      enabled: true,
      lastTriggered: null
    })));
    vi.mocked(prisma.aBTest.update).mockResolvedValue({
      ...mockExperiment,
      endDate: new Date(),
      configuration: {
        ...mockExperiment.configuration,
        distribution: [0.4, 0.6]
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.variant).toBe('A');
    expect(logger.info).toHaveBeenCalledWith('Applied experiment variant', {
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1'
      },
      variant: 'A'
    });
  });

  it('should handle case when no adaptations are needed', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1',
        metrics: {
          conversionRate: 0.3,
          bounceRate: 0.2
        }
      }
    });

    const mockExperiment = {
      id: 'test-id',
      name: 'Test Experiment',
      status: ExperimentStatus.ACTIVE,
      description: 'Test description',
      startDate: new Date(),
      endDate: null,
      configuration: {
        variants: ['A', 'B'],
        distribution: [0.5, 0.5],
        adaptationRules: ['rule-1', 'rule-2']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockRules = [
      {
        id: 'rule-1',
        name: 'High Bounce Rate Rule',
        condition: {
          metric: 'bounceRate',
          operator: '>',
          value: 0.4
        },
        action: {
          type: 'ADJUST_DISTRIBUTION',
          parameters: {
            variant: 'A',
            adjustment: -0.1
          }
        }
      }
    ];

    vi.mocked(prisma.aBTest.findUnique).mockResolvedValue({
      ...mockExperiment,
      endDate: new Date()
    });
    vi.mocked(prisma.adaptationRule.findMany).mockResolvedValue(mockRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: '',
      type: 'DISTRIBUTION',
      conditions: rule.condition,
      actions: rule.action,
      priority: 'LOW',
      enabled: true,
      lastTriggered: null
    })));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.variant).toBe('A');
    expect(logger.info).toHaveBeenCalledWith('Applied experiment variant', {
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1'
      },
      variant: 'A'
    });
  });

  it('should handle database errors', async () => {
    const request = new NextRequest('http://localhost');
    request.json = vi.fn().mockResolvedValue({
      experimentId: 'test-id',
      context: {
        userId: 'user-1',
        sessionId: 'session-1',
        metrics: {
          conversionRate: 0.1,
          bounceRate: 0.5
        }
      }
    });

    vi.mocked(prisma.aBTest.findUnique).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to apply experiment');
    expect(logger.error).toHaveBeenCalledWith('Failed to apply experiment', {
      error: expect.any(Error)
    });
  });
});
