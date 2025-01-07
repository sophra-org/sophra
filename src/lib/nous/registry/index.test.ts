import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Registry } from './index'
import { ModelConfig, ModelVersion } from '@/lib/shared/database/validation/generated'
import { RegistryStore } from './store'

// Mock dependencies
vi.mock('./store')
vi.mock('./metadata')
vi.mock('./version')
vi.mock('@/lib/shared/logger')
vi.mock('cuid', () => ({ default: () => 'test-id' }))

describe('Registry', () => {
  let registry: Registry
  const mockConfig: ModelConfig = {
    id: 'config-1',
    type: 'SEARCH_RANKER',
    hyperparameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 10,
      optimizer: 'adam',
      dropoutRate: 0.2,
      hiddenLayers: [128, 64],
      activationFunction: 'relu'
    },
    features: [],
    trainingParams: {
      epochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      optimizer: 'adam'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    registry = new Registry()
  })

  describe('registerModel', () => {
    it('should successfully register a model', async () => {
      const result = await registry.registerModel(mockConfig)
      
      expect(result).toEqual({
        id: 'test-id',
        configId: 'config-1',
        createdAt: expect.any(Date),
        metrics: {},
        artifactPath: expect.stringMatching(/^models\/model_\d+$/),
        parentVersion: null
      })
    })

    it('should throw error for invalid config', async () => {
      await expect(registry.registerModel({} as ModelConfig))
        .rejects.toThrow('Invalid model configuration')
    })
  })

  describe('getModel', () => {
    it('should return null for non-existent model', async () => {
      const result = await registry.getModel('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('updateModel', () => {
    it('should return null for non-existent model', async () => {
      const result = await registry.updateModel('non-existent', {})
      expect(result).toBeNull()
    })
  })

  describe('deleteModel', () => {
    it('should return false for invalid model ID', async () => {
      const result = await registry.deleteModel('')
      expect(result).toBeFalsy()
    })
  })

  describe('listModels', () => {
    it('should return empty array on error', async () => {
      vi.spyOn(RegistryStore.prototype, 'listEntries').mockImplementation(() => {
        throw new Error('Test error')
      })
      
      const result = await registry.listModels()
      expect(result).toEqual([])
    })
  })
}) 