import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchOptimizationModel } from './models'
import prisma from '@/lib/shared/database/client'
import { ModelType } from '@prisma/client'

// Mock prisma
vi.mock('@/lib/shared/database/client', () => ({
  default: {
    modelState: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('SearchOptimizationModel', () => {
  let model: SearchOptimizationModel

  beforeEach(() => {
    vi.clearAllMocks()
    model = new SearchOptimizationModel()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const params = model.getParameters()
      expect(params.featureNames).toEqual([])
      expect(params.isTrained).toBe(false)
      expect(params.numFeatures).toBe(0)
      expect(Array.isArray(params.weights)).toBe(true)
      expect(typeof params.bias).toBe('number')
    })
  })

  describe('training', () => {
    it('should train on valid features and target', async () => {
      const features = [
        { feature1: 1, feature2: 2 },
        { feature1: 2, feature2: 3 },
      ]
      const target = 'feature1'

      await model.train(features, target)

      const params = model.getParameters()
      expect(params.isTrained).toBe(true)
      expect(params.featureNames).toEqual(['feature1', 'feature2'])
      expect(params.weights).toHaveLength(2)
    })

    it('should throw error when no features provided', async () => {
      await expect(model.train([], 'target')).rejects.toThrow('No features provided for training')
    })
  })

  describe('prediction', () => {
    it('should throw error when predicting without training', async () => {
      await expect(model.predict({ feature1: 1 })).rejects.toThrow('Model must be trained before prediction')
    })

    it('should make predictions after training', async () => {
      const features = [
        { feature1: 1, feature2: 2 },
        { feature1: 2, feature2: 3 },
      ]
      await model.train(features, 'feature1')

      const prediction = await model.predict({ feature1: 1.5, feature2: 2.5 })

      expect(prediction).toHaveProperty('predictedRelevance')
      expect(prediction).toHaveProperty('confidence')
      expect(prediction).toHaveProperty('feature1')
      expect(prediction).toHaveProperty('feature2')
    })
  })

  describe('evaluation', () => {
    it('should throw error when evaluating without training', async () => {
      await expect(model.evaluate([])).rejects.toThrow('Model must be trained before evaluation')
    })

    it('should calculate metrics after training', async () => {
      const features = [
        { feature1: 1, feature2: 2, relevance: 1 },
        { feature1: 2, feature2: 3, relevance: 2 },
      ]
      await model.train(features, 'relevance')

      const metrics = await model.evaluate(features)

      expect(metrics).toHaveProperty('accuracy')
      expect(metrics).toHaveProperty('precision')
      expect(metrics).toHaveProperty('recall')
      expect(metrics).toHaveProperty('f1Score')
      expect(metrics).toHaveProperty('latencyMs')
      expect(metrics).toHaveProperty('loss')
      expect(metrics).toHaveProperty('validationMetrics')
      expect(metrics.validationMetrics).toHaveProperty('mse')
      expect(metrics.validationMetrics).toHaveProperty('rmse')
      expect(metrics.validationMetrics).toHaveProperty('mae')
    })
  })

  describe('state management', () => {
    it('should save model state', async () => {
      const mockVersionId = 'test-version-id'
      vi.mocked(prisma.modelState.create).mockResolvedValueOnce({
        versionId: mockVersionId,
        id: '1',
        weights: [],
        bias: 0,
        scaler: { mean: [], std: [] },
        featureNames: [],
        isTrained: false,
        hyperparameters: null,
        currentEpoch: 0,
        trainingProgress: 0,
        lastTrainingError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        modelType: ModelType.SEARCH_RANKER
      })

      const versionId = await model.saveState()
      expect(versionId).toBe(mockVersionId)
      expect(prisma.modelState.create).toHaveBeenCalled()
    })

    it('should load model state', async () => {
      const mockState = {
        versionId: 'test-version-id',
        id: '1',
        weights: [1, 2],
        bias: 0.5,
        scaler: { mean: [0, 0], std: [1, 1] },
        featureNames: ['feature1', 'feature2'],
        isTrained: true,
        hyperparameters: null,
        currentEpoch: 0,
        trainingProgress: 100,
        lastTrainingError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        modelType: ModelType.SEARCH_RANKER
      }

      vi.mocked(prisma.modelState.findUnique).mockResolvedValueOnce(mockState)

      await model.loadState('test-version-id')
      const params = model.getParameters()
      expect(params.weights).toEqual(mockState.weights)
      expect(params.bias).toBe(mockState.bias)
      expect(params.featureNames).toEqual(mockState.featureNames)
      expect(params.isTrained).toBe(mockState.isTrained)
    })

    it('should throw error when loading non-existent state', async () => {
      vi.mocked(prisma.modelState.findUnique).mockResolvedValueOnce(null)
      await expect(model.loadState('non-existent')).rejects.toThrow('Model version non-existent not found')
    })
  })
}) 