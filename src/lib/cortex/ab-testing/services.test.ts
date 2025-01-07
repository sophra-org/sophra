// Mock Prisma before any other imports
import { mockPrisma } from '@/lib/shared/test/prisma.mock'

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  Prisma: {
    JsonValue: undefined,
    JsonObject: undefined,
  },
  ExperimentStatus: {
    DRAFT: 'DRAFT',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
  },
}))

vi.mock('@/lib/shared/database/client', () => ({
  default: mockPrisma,
  prisma: mockPrisma
}))

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ABTestingService } from './services'
import { ExperimentStatus, PrismaClient } from '@prisma/client'
import type { CreateABTestParams } from './services'

describe('ABTestingService', () => {
  let service: ABTestingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ABTestingService({
      environment: 'test',
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        service: 'ab-testing',
        silent: false,
        format: () => ({
          transform: (msg: any) => msg
        }),
        levels: {
          error: 0,
          warn: 1,
          info: 2,
          debug: 3,
        }
      } as any
    })
  })

  afterEach(async () => {
    await service.disconnect()
  })

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }])

      const result = await service.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when database check fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB Error'))

      const result = await service.healthCheck()
      expect(result).toBe(false)
    })
  })

  // ... existing code ...
}) 