import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ABTestingService } from './services'
import { ExperimentStatus, PrismaClient } from '@prisma/client'
import type { CreateABTestParams } from './services'

// Mock PrismaClient
const mockPrismaClient = {
  $queryRaw: vi.fn(),
  $disconnect: vi.fn(),
  aBTest: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  aBTestAssignment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  aBTestMetric: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
  ExperimentStatus: {
    DRAFT: 'DRAFT',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
  },
}))

describe('ABTestingService', () => {
  let service: ABTestingService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ABTestingService({
      environment: 'test',
    })
  })

  afterEach(async () => {
    await service.disconnect()
  })

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ 1: 1 }])

      const result = await service.healthCheck()
      expect(result).toBe(true)
    })

    it('should return false when database check fails', async () => {
      mockPrismaClient.$queryRaw.mockRejectedValueOnce(new Error('DB Error'))

      const result = await service.healthCheck()
      expect(result).toBe(false)
    })
  })

  describe('createTest', () => {
    it('should create a new AB test', async () => {
      const testParams: CreateABTestParams = {
        name: 'Test Experiment',
        description: 'A test experiment',
        status: ExperimentStatus.DRAFT,
        configuration: {
          variants: [
            {
              id: 'control',
              name: 'Control',
              allocation: 0.5,
              weights: { weight1: 1 },
            },
            {
              id: 'variant',
              name: 'Variant',
              allocation: 0.5,
              weights: { weight1: 1.2 },
            },
          ],
          metrics: {
            primary: 'conversion',
            secondary: ['engagement'],
          },
        },
      }

      const mockCreatedTest = {
        id: 'test-1',
        ...testParams,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaClient.aBTest.create.mockResolvedValueOnce(mockCreatedTest)

      const result = await service.createTest(testParams)
      expect(result).toEqual(mockCreatedTest)
      expect(mockPrismaClient.aBTest.create).toHaveBeenCalledWith({
        data: {
          name: testParams.name,
          description: testParams.description,
          status: testParams.status,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          configuration: JSON.parse(JSON.stringify(testParams.configuration)),
        },
      })
    })

    it('should throw error if variant allocations do not sum to 1', async () => {
      const testParams: CreateABTestParams = {
        name: 'Invalid Test',
        configuration: {
          variants: [
            {
              id: 'control',
              name: 'Control',
              allocation: 0.3,
              weights: { weight1: 1 },
            },
            {
              id: 'variant',
              name: 'Variant',
              allocation: 0.3,
              weights: { weight1: 1.2 },
            },
          ],
        },
      }

      await expect(service.createTest(testParams)).rejects.toThrow('Variant allocations must sum to 1')
    })
  })

  describe('assignVariant', () => {
    it('should assign variant based on allocation', async () => {
      const mockTest = {
        id: 'test-1',
        status: ExperimentStatus.ACTIVE,
        configuration: {
          variants: [
            {
              id: 'control',
              name: 'Control',
              allocation: 0.5,
              weights: { weight1: 1 },
            },
            {
              id: 'variant',
              name: 'Variant',
              allocation: 0.5,
              weights: { weight1: 1.2 },
            },
          ],
        },
      }

      mockPrismaClient.aBTest.findUnique.mockResolvedValueOnce(mockTest)
      const mockAssignment = {
        id: 'assignment-1',
        testId: 'test-1',
        variantId: 'control',
        sessionId: 'session-1',
        timestamp: new Date(),
      }
      mockPrismaClient.aBTestAssignment.create.mockResolvedValueOnce(mockAssignment)

      const result = await service.assignVariant('session-1', 'test-1')
      expect(result).toBeDefined()
      expect(result).toEqual({
        id: expect.stringMatching(/^(control|variant)$/),
        weights: expect.objectContaining({
          weight1: expect.any(Number),
        }),
      })
      expect(mockPrismaClient.aBTestAssignment.create).toHaveBeenCalledWith({
        data: {
          testId: 'test-1',
          sessionId: 'session-1',
          variantId: expect.stringMatching(/^(control|variant)$/),
          timestamp: expect.any(Date),
        },
      })
    })

    it('should return existing assignment if one exists', async () => {
      const existingAssignment = {
        id: 'assignment-1',
        testId: 'test-1',
        variantId: 'control',
        sessionId: 'session-1',
        createdAt: new Date(),
      }

      mockPrismaClient.aBTestAssignment.findFirst.mockResolvedValueOnce(existingAssignment)
      
      const mockTest = {
        id: 'test-1',
        configuration: {
          variants: [
            {
              id: 'control',
              name: 'Control',
              allocation: 0.5,
              weights: { weight1: 1 },
            },
          ],
        },
      }
      mockPrismaClient.aBTest.findUnique.mockResolvedValueOnce(mockTest)

      const result = await service.assignVariant('session-1', 'test-1')
      expect(result).toEqual({
        id: 'control',
        weights: { weight1: 1 },
      })
      expect(mockPrismaClient.aBTestAssignment.create).not.toHaveBeenCalled()
    })
  })

  describe('trackConversion', () => {
    it('should track conversion event', async () => {
      const conversionEvent = {
        testId: 'test-1',
        variantId: 'control',
        sessionId: 'session-1',
        event: 'click',
        value: 1,
      }

      const mockMetric = {
        id: 'metric-1',
        testId: 'test-1',
        variantId: 'control',
        sessionId: 'session-1',
        eventType: 'click',
        value: 1,
        timestamp: expect.any(Date),
      }

      mockPrismaClient.aBTestMetric.create.mockResolvedValueOnce(mockMetric)

      await service.trackConversion(conversionEvent)
      expect(mockPrismaClient.aBTestMetric.create).toHaveBeenCalledWith({
        data: {
          test: {
            connect: { id: conversionEvent.testId },
          },
          session: {
            connect: { id: conversionEvent.sessionId },
          },
          variantId: conversionEvent.variantId,
          eventType: conversionEvent.event,
          value: conversionEvent.value,
          timestamp: expect.any(Date),
        },
      })
    })
  })
}) 