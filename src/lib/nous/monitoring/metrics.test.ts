import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MetricsService } from './metrics'
import { MetricType } from '@prisma/client'
import { prisma } from '@/lib/shared/database/client'
import { Logger } from '@/lib/shared/types'
import { createLogger, format, transports } from 'winston'

// Mock dependencies
vi.mock('@/lib/shared/database/client', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback({
      engineMetric: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      learningMetric: {
        create: vi.fn(),
        findMany: vi.fn(),
      }
    })),
    engineMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    learningMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('MetricsService', () => {
  let service: MetricsService
  let mockLogger: Logger
  let mockEngineLogger: Logger
  let mockLearningLogger: Logger

  beforeEach(() => {
    vi.clearAllMocks()

    mockEngineLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(),
    } as unknown as Logger

    mockLearningLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(),
    } as unknown as Logger

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn((options) => {
        if (options.context === 'engine-metrics') return mockEngineLogger
        if (options.context === 'learning-metrics') return mockLearningLogger
        return mockLogger
      }),
    } as unknown as Logger

    service = new MetricsService({
      logger: mockLogger,
      sampleRate: 1.0,
      batchSize: 100,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const defaultService = new MetricsService({ logger: mockLogger })
      expect(defaultService).toBeDefined()
    })

    it('should initialize with custom config', () => {
      const customService = new MetricsService({
        logger: mockLogger,
        sampleRate: 0.5,
        batchSize: 50,
      })
      expect(customService).toBeDefined()
    })
  })

  describe('engine metrics', () => {
    it('should record engine metric', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
        metadata: { source: 'test' },
      }

      await service.recordEngineMetric(metricData)

      expect(prisma.$transaction).toHaveBeenCalled()
      const transactionCallback = vi.mocked(prisma.$transaction).mock.calls[0][0]
      const tx = {
        engineMetric: {
          create: vi.fn(),
        },
      } as any

      await transactionCallback(tx)
      
      expect(tx.engineMetric.create).toHaveBeenCalledWith({
        data: {
          type: MetricType.FEEDBACK_SCORE,
          value: 100,
          confidence: 0.95,
          metadata: JSON.stringify({ source: 'test' }),
          operationId: undefined,
          timestamp: expect.any(Date),
        },
      })

      expect(mockLogger.child({ context: 'engine-metrics' }).info).toHaveBeenCalledWith(
        'Successfully recorded engine metric',
        {
          type: MetricType.FEEDBACK_SCORE,
          value: 100,
          confidence: 0.95,
          operationId: undefined,
        }
      )
    })

    it('should handle engine metric recording errors', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
      }

      const error = new Error('Database error')
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(error)

      await expect(service.recordEngineMetric(metricData)).rejects.toThrow(
        'Database error: Failed to record engine metric - Database error'
      )
      expect(mockLogger.child({ context: 'engine-metrics' }).error).toHaveBeenCalledWith(
        'Failed to record engine metric',
        {
          error: 'Database error',
          data: metricData,
          sampleRate: 1.0
        }
      )
    })

    it('should respect sampling rate', async () => {
      vi.clearAllMocks()
      vi.spyOn(Math, 'random').mockReturnValue(1.0) // Always skip

      const sampledService = new MetricsService({
        logger: mockLogger,
        sampleRate: 0.5, // Sample half the time
      })

      await sampledService.recordEngineMetric({
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
      })

      expect(prisma.$transaction).not.toHaveBeenCalled()
      expect(mockEngineLogger.debug).toHaveBeenCalledWith(
        'Skipping metric due to sampling',
        {
          type: MetricType.FEEDBACK_SCORE,
          sampleRate: 0.5
        }
      )

      // Test that it does record when random value is less than sample rate
      vi.clearAllMocks()
      vi.spyOn(Math, 'random').mockReturnValue(0.0) // Always record

      const sampledService2 = new MetricsService({
        logger: mockLogger,
        sampleRate: 0.5, // Sample half the time
      })

      await sampledService2.recordEngineMetric({
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('learning metrics', () => {
    it('should record learning metric', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 0.5,
        interval: '1h',
        sessionId: 'test-session',
        modelId: 'test-model',
        metadata: { epoch: 1 },
      }

      await service.recordLearningMetrics(metricData)

      expect(prisma.$transaction).toHaveBeenCalled()
      const transactionCallback = vi.mocked(prisma.$transaction).mock.calls[0][0]
      const tx = {
        learningMetric: {
          create: vi.fn(),
        },
      } as any

      await transactionCallback(tx)

      expect(tx.learningMetric.create).toHaveBeenCalledWith({
        data: {
          type: MetricType.FEEDBACK_SCORE,
          value: 0.5,
          interval: '1h',
          sessionId: 'test-session',
          modelId: 'test-model',
          metadata: JSON.stringify({ epoch: 1 }),
          timestamp: expect.any(Date),
          timeframe: '1h',
          aggregated: false,
        },
      })

      expect(mockLogger.child({ context: 'learning-metrics' }).info).toHaveBeenCalledWith(
        'Successfully recorded learning metric',
        {
          type: MetricType.FEEDBACK_SCORE,
          value: 0.5,
          interval: '1h',
          sessionId: 'test-session',
          modelId: 'test-model',
          metadata: true,
        }
      )
    })

    it('should handle learning metric recording errors', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 0.5,
        interval: '1h',
      }

      const error = new Error('Database error')
      vi.mocked(prisma.$transaction).mockRejectedValueOnce(error)

      await expect(service.recordLearningMetrics(metricData)).rejects.toThrow(
        'Database error: Failed to record learning metric - Database error'
      )
      expect(mockLogger.child({ context: 'learning-metrics' }).error).toHaveBeenCalledWith(
        'Failed to record learning metric',
        {
          error: 'Database error',
          data: metricData,
          metadata: false
        }
      )
    })

    it('should handle optional fields', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 0.5,
        interval: '1h',
      }

      await service.recordLearningMetrics(metricData)

      expect(prisma.$transaction).toHaveBeenCalled()
      const transactionCallback = vi.mocked(prisma.$transaction).mock.calls[0][0]
      const tx = {
        learningMetric: {
          create: vi.fn(),
        },
      } as any

      await transactionCallback(tx)

      expect(tx.learningMetric.create).toHaveBeenCalledWith({
        data: {
          type: MetricType.FEEDBACK_SCORE,
          value: 0.5,
          interval: '1h',
          sessionId: undefined,
          modelId: undefined,
          metadata: undefined,
          timestamp: expect.any(Date),
          timeframe: '1h',
          aggregated: false,
        },
      })

      expect(mockLogger.child({ context: 'learning-metrics' }).info).toHaveBeenCalledWith(
        'Successfully recorded learning metric',
        {
          type: MetricType.FEEDBACK_SCORE,
          value: 0.5,
          interval: '1h',
          sessionId: undefined,
          modelId: undefined,
          metadata: false,
        }
      )
    })
  })

  describe('logging behavior', () => {
    it('should log successful engine metric recording', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
      }

      await service.recordEngineMetric(metricData)

      expect(mockLogger.child({ context: 'engine-metrics' }).info).toHaveBeenCalledWith(
        'Successfully recorded engine metric',
        {
          type: MetricType.FEEDBACK_SCORE,
          value: 100,
          confidence: 0.95,
          operationId: undefined,
        }
      )
    })

    it('should log successful learning metric recording', async () => {
      const metricData = {
        type: MetricType.FEEDBACK_SCORE,
        value: 0.5,
        interval: '1h',
      }

      await service.recordLearningMetrics(metricData)

      expect(mockLogger.child({ context: 'learning-metrics' }).info).toHaveBeenCalledWith(
        'Successfully recorded learning metric',
        {
          type: MetricType.FEEDBACK_SCORE,
          value: 0.5,
          interval: '1h',
          sessionId: undefined,
          modelId: undefined,
          metadata: false,
        }
      )
    })

    it('should log when skipping metrics due to sampling', async () => {
      vi.clearAllMocks()
      vi.spyOn(Math, 'random').mockReturnValue(1.0) // Always skip

      const sampledService = new MetricsService({
        logger: mockLogger,
        sampleRate: 0.5, // Sample half the time
      })

      await sampledService.recordEngineMetric({
        type: MetricType.FEEDBACK_SCORE,
        value: 100,
        confidence: 0.95,
      })

      expect(mockEngineLogger.debug).toHaveBeenCalledWith(
        'Skipping metric due to sampling',
        {
          type: MetricType.FEEDBACK_SCORE,
          sampleRate: 0.5,
        }
      )
    })
  })
})
