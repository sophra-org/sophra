import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LearningPipeline } from './pipeline'
import { Registry } from '@/lib/nous/registry'
import { OpenAIClient } from '../clients/openai'
import { Event, EventType, ModelType } from '@/lib/nous/types'
import { mockPrisma } from '~/vitest.setup'

// Only keeping logger mock since other mocks are handled in vitest.setup
vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('LearningPipeline', () => {
  let pipeline: LearningPipeline
  let mockRegistry: Registry
  let mockOpenAI: OpenAIClient
  // skipcq: JS-0323
  let mockModelState: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockModelState = {
      id: 'test-state-id',
      versionId: 'test-model-id',
      weights: [],
      bias: 0,
      scaler: {},
      featureNames: [],
      isTrained: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      modelType: "OPENAI_FINE_TUNED",
      hyperparameters: {},
      currentEpoch: 0,
      trainingProgress: 0,
      lastTrainingError: null,
    }

    // Setup mock registry
    mockRegistry = {
      registerModel: vi.fn(),
      getModel: vi.fn(),
      updateModel: vi.fn(),
      deleteModel: vi.fn(),
    } as unknown as Registry

    // Setup mock OpenAI client
    mockOpenAI = {
      createFineTune: vi.fn(),
      getFineTuneStatus: vi.fn(),
      cancelFineTune: vi.fn(),
      deleteFineTune: vi.fn(),
    } as unknown as OpenAIClient

    pipeline = new LearningPipeline(mockRegistry, mockOpenAI)

    // Setup default model state
    vi.mocked(mockPrisma.modelState.create).mockResolvedValue(mockModelState)
    vi.mocked(mockPrisma.modelState.update).mockResolvedValue({
      ...mockModelState,
      trainingProgress: 100,
    })
    vi.mocked(mockPrisma.modelState.findUnique).mockResolvedValue(mockModelState)
  })

  describe('calculateCost', () => {
    it('should calculate cost for gpt-3.5-turbo', () => {
      const cost = pipeline.calculateCost(1000, 'gpt-3.5-turbo')
      expect(cost).toBe(0.002) // $0.002 per 1K tokens
    })

    it('should calculate cost for gpt-4', () => {
      const cost = pipeline.calculateCost(1000, 'gpt-4')
      expect(cost).toBe(0.03) // $0.03 per 1K tokens
    })

    it('should use default model when not specified', () => {
      const cost = pipeline.calculateCost(1000)
      expect(cost).toBe(0.002) // Should default to gpt-3.5-turbo pricing
    })
  })

  describe('trainAndDeploy', () => {
    const mockEvents: Event[] = [
      {
        type: EventType.SEARCH,
        timestamp: new Date(),
        data: { query: 'test query' },
        metadata: { source: 'test' },
      },
    ]

    it('should register and train a model with default config', async () => {
      const mockModelId = 'test-model-id'
      const mockModel = {
        id: mockModelId,
        createdAt: new Date(),
        metrics: { accuracy: 0.9 },
        artifactPath: 'path/to/model',
        configId: JSON.stringify({
          type: ModelType.OPENAI_FINE_TUNED,
          hyperparameters: { learningRate: 0.001 },
          features: ['default_feature'],
          trainingParams: { epochs: 3 },
        }),
        parentVersion: null,
      }

      const mockConfig = {
        type: ModelType.OPENAI_FINE_TUNED,
        hyperparameters: { learningRate: 0.001 },
        features: ['default_feature'],
        trainingParams: { epochs: 3 },
      }

      vi.mocked(mockRegistry.registerModel).mockResolvedValueOnce(mockModel)
      vi.mocked(mockRegistry.getModel)
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockModel)

      vi.mocked(mockPrisma.modelVersion.findUnique).mockResolvedValueOnce({
        id: mockModelId,
        configId: JSON.stringify(mockConfig),
        createdAt: new Date(),
        metrics: { accuracy: 0.9 },
        artifactPath: 'path/to/model',
        parentVersion: null,
      })

      vi.mocked(mockPrisma.modelState.update)
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 0,
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 100,
        })

      const result = await pipeline.trainAndDeploy(mockEvents, mockConfig)

      expect(result.id).toBe(mockModelId)
      expect(mockRegistry.registerModel).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "OPENAI_FINE_TUNED",
          hyperparameters: mockConfig.hyperparameters,
          features: mockConfig.features,
          trainingParams: mockConfig.trainingParams,
        })
      )
    })

    it('should use provided config when available', async () => {
      const customConfig = {
        type: ModelType.OPENAI_FINE_TUNED,
        hyperparameters: { learningRate: 0.01 },
        features: ['custom_feature'],
        trainingParams: { epochs: 5 },
      }

      const mockModel = {
        id: 'test-model-id',
        createdAt: new Date(),
        metrics: { accuracy: 0.9 },
        artifactPath: 'path/to/model',
        configId: JSON.stringify(customConfig),
        parentVersion: null,
      }

      vi.mocked(mockRegistry.registerModel).mockResolvedValueOnce(mockModel)
      vi.mocked(mockRegistry.getModel)
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockModel)
        .mockResolvedValueOnce(mockModel)

      vi.mocked(mockPrisma.modelVersion.findUnique).mockResolvedValueOnce({
        id: 'test-model-id',
        configId: JSON.stringify(customConfig),
        createdAt: new Date(),
        metrics: { accuracy: 0.9 },
        artifactPath: 'path/to/model',
        parentVersion: null,
      })

      vi.mocked(mockPrisma.modelState.update)
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 0,
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 100,
        })

      const result = await pipeline.trainAndDeploy(mockEvents, customConfig)

      expect(result.id).toBe('test-model-id')
      expect(mockRegistry.registerModel).toHaveBeenCalledWith(
        expect.objectContaining({
          hyperparameters: customConfig.hyperparameters,
          features: customConfig.features,
          trainingParams: customConfig.trainingParams,
        })
      )
    })

    it('should handle training errors', async () => {
      vi.mocked(mockRegistry.registerModel).mockRejectedValueOnce(new Error('Registration failed'))

      await expect(pipeline.trainAndDeploy(mockEvents)).rejects.toThrow('Registration failed')
    })
  })

  describe('OpenAI training', () => {
    const mockJobId = 'test-job-id'
    const mockModelId = 'test-model-id'
    const mockModelState = {
      id: 'test-state-id',
      versionId: mockModelId,
      weights: [],
      bias: 0,
      scaler: null,
      featureNames: [],
      isTrained: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      modelType: ModelType.OPENAI_FINE_TUNED,
      hyperparameters: {},
      currentEpoch: 0,
      trainingProgress: 0,
      lastTrainingError: null,
    }

    beforeEach(() => {
      // Mock registry
      vi.mocked(mockRegistry.registerModel).mockResolvedValueOnce({
        id: mockModelId,
        configId: JSON.stringify({
          type: "OPENAI_FINE_TUNED",
          hyperparameters: {},
          features: [],
          trainingParams: {},
        }),
        createdAt: new Date(),
        metrics: {},
        artifactPath: '',
        parentVersion: null,
      })

      vi.mocked(mockRegistry.getModel)
        .mockResolvedValue({
          id: mockModelId,
          configId: JSON.stringify({
            type: "OPENAI_FINE_TUNED",
            hyperparameters: {},
            features: [],
            trainingParams: {},
          }),
          createdAt: new Date(),
          metrics: {},
          artifactPath: '',
          parentVersion: null,
        })

      // Mock model version lookup
      vi.mocked(mockPrisma.modelVersion.findUnique).mockResolvedValueOnce({
        id: mockModelId,
        configId: JSON.stringify({
          type: "OPENAI_FINE_TUNED",
          hyperparameters: {},
          features: [],
          trainingParams: {},
        }),
        createdAt: new Date(),
        metrics: {},
        artifactPath: '',
        parentVersion: null,
      })

      // Mock OpenAI responses
      vi.mocked(mockOpenAI.createFineTune).mockResolvedValueOnce({
        jobId: mockJobId,
        status: 'queued',
      })

      vi.mocked(mockOpenAI.getFineTuneStatus)
        .mockResolvedValueOnce({
          status: 'succeeded',
          fineTunedModel: 'test-model-id',
          error: undefined,
        })

      // Mock model state creation and updates
      vi.mocked(mockPrisma.modelState.create).mockResolvedValueOnce({
        ...mockModelState,
        trainingProgress: 0,
        modelType: "OPENAI_FINE_TUNED"
      })

      vi.mocked(mockPrisma.modelState.update)
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 50,
          modelType: "OPENAI_FINE_TUNED"
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 100,
          isTrained: true,
          modelType: "OPENAI_FINE_TUNED"
        })
    })

    it('should train OpenAI model successfully', async () => {
      const event = {
        type: EventType.SEARCH,
        timestamp: new Date(),
        data: { query: 'Hello' },
        metadata: { source: 'test' },
      };

      const result = await pipeline.trainAndDeploy(
        [event],
        {
          type: ModelType.OPENAI_FINE_TUNED,
          hyperparameters: {},
          features: [],
          trainingParams: {},
        }
      )

      expect(result.id).toBe(mockModelId)
      expect(mockOpenAI.createFineTune).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        training_data: [{
          prompt: JSON.stringify(event),
          completion: JSON.stringify(event.data),
        }],
      })
      expect(mockOpenAI.getFineTuneStatus).toHaveBeenCalledWith(mockJobId)
      expect(mockPrisma.modelState.update).toHaveBeenCalledTimes(3)
    })

    it('should handle fine-tuning failure', async () => {
      // Override the successful mock from beforeEach
      vi.mocked(mockOpenAI.createFineTune).mockResolvedValueOnce({
        jobId: mockJobId,
        status: 'queued',
      })

      vi.mocked(mockOpenAI.getFineTuneStatus).mockReset()
      vi.mocked(mockOpenAI.getFineTuneStatus).mockResolvedValueOnce({
        status: 'failed',
        fineTunedModel: null,
        error: 'Fine-tuning failed',
      })

      await expect(
        pipeline.trainAndDeploy(
          [
            {
              type: EventType.SEARCH,
              timestamp: new Date(),
              data: { query: 'Hello' },
              metadata: { source: 'test' },
            },
          ],
          {
            type: ModelType.OPENAI_FINE_TUNED,
            hyperparameters: {},
            features: [],
            trainingParams: {},
          }
        )
      ).rejects.toThrow('Fine-tuning failed')

      expect(mockPrisma.modelState.update).toHaveBeenCalledWith({
        where: { versionId: mockModelId },
        data: {
          lastTrainingError: 'Fine-tuning failed',
          trainingProgress: 0,
        },
      })
    })
  })

  describe('custom model training', () => {
    it('should handle custom model training process', async () => {
      const mockModelId = 'test-model-id'
      const mockConfig = {
        type: ModelType.PATTERN_DETECTOR,
        hyperparameters: { batchSize: 32 },
        features: [],
        trainingParams: { epochs: 2 },
      }

      // Mock registry
      vi.mocked(mockRegistry.registerModel).mockResolvedValueOnce({
        id: mockModelId,
        configId: JSON.stringify(mockConfig),
        createdAt: new Date(),
        metrics: {},
        artifactPath: '',
        parentVersion: null,
      })

      vi.mocked(mockRegistry.getModel)
        .mockResolvedValueOnce({
          id: mockModelId,
          configId: JSON.stringify(mockConfig),
          createdAt: new Date(),
          metrics: {},
          artifactPath: '',
          parentVersion: null,
        })
        .mockResolvedValueOnce({
          id: mockModelId,
          configId: JSON.stringify(mockConfig),
          createdAt: new Date(),
          metrics: {},
          artifactPath: '',
          parentVersion: null,
        })
        .mockResolvedValueOnce({
          id: mockModelId,
          configId: JSON.stringify(mockConfig),
          createdAt: new Date(),
          metrics: {},
          artifactPath: '',
          parentVersion: null,
        })

      // Mock model version lookup
      vi.mocked(mockPrisma.modelVersion.findUnique).mockResolvedValueOnce({
        id: mockModelId,
        configId: JSON.stringify(mockConfig),
        createdAt: new Date(),
        metrics: {},
        artifactPath: '',
        parentVersion: null,
      })

      // Mock model state creation and updates
      vi.mocked(mockPrisma.modelState.create).mockResolvedValueOnce({
        ...mockModelState,
        trainingProgress: 0,
      })

      // Mock model state updates - initial + 2 epochs + final
      vi.mocked(mockPrisma.modelState.update)
        .mockResolvedValueOnce({
          ...mockModelState,
          trainingProgress: 0,
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          currentEpoch: 0,
          trainingProgress: 0,
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          currentEpoch: 1,
          trainingProgress: 50,
        })
        .mockResolvedValueOnce({
          ...mockModelState,
          isTrained: true,
          trainingProgress: 100,
        })

      const result = await pipeline.trainAndDeploy(
        [
          {
            type: EventType.SEARCH,
            timestamp: new Date(),
            data: { feature1: 1 },
            metadata: { source: 'test' },
          },
          {
            type: EventType.SEARCH,
            timestamp: new Date(),
            data: { feature2: 2 },
            metadata: { source: 'test' },
          }
        ],
        mockConfig
      )

      expect(result.id).toBe(mockModelId)
      expect(mockPrisma.modelState.update).toHaveBeenCalledTimes(4)
      expect(mockPrisma.modelState.update).toHaveBeenNthCalledWith(1, {
        where: { versionId: mockModelId },
        data: { trainingProgress: 0 }
      })
      expect(mockPrisma.modelState.update).toHaveBeenNthCalledWith(2, {
        where: { versionId: mockModelId },
        data: { currentEpoch: 0, trainingProgress: 0 }
      })
      expect(mockPrisma.modelState.update).toHaveBeenNthCalledWith(3, {
        where: { versionId: mockModelId },
        data: { currentEpoch: 1, trainingProgress: 50 }
      })
      expect(mockPrisma.modelState.update).toHaveBeenNthCalledWith(4, {
        where: { versionId: mockModelId },
        data: { trainingProgress: 100, isTrained: true }
      })
    })
  })
}) 