import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Registry } from './index'
import { ModelConfig } from '@/lib/shared/database/validation/generated'
import logger from '@/lib/shared/logger'

vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}))

describe('Registry', () => {
  let registry: Registry

  const mockConfig: ModelConfig = {
    id: 'test-config',
    type: 'SEARCH_RANKER',
    features: ['feature1'],
    hyperparameters: { param1: 'value1' },
    trainingParams: { epochs: 10 },
  }

  beforeEach(() => {
    registry = new Registry()
    vi.clearAllMocks()
  })

  describe('model registration', () => {
    it('should register a new model', async () => {
      const model = await registry.registerModel(mockConfig)
      expect(model).toBeDefined()
      expect(model.configId).toBe(mockConfig.id)
      expect(model.artifactPath).toMatch(/^models\/model_\d+$/)
    })

    it('should handle registration errors', async () => {
      const invalidConfig = { ...mockConfig, id: undefined }
      await expect(registry.registerModel(invalidConfig as any)).rejects.toThrow('Invalid model configuration')
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to register model:',
        expect.any(Object)
      )
    })
  })

  describe('model retrieval', () => {
    it('should retrieve a registered model', async () => {
      const registered = await registry.registerModel(mockConfig)
      const retrieved = await registry.getModel(registered.id)
      expect(retrieved).toEqual(registered)
    })

    it('should return null for non-existent model', async () => {
      const model = await registry.getModel('non-existent')
      expect(model).toBeNull()
    })
  })

  describe('model updates', () => {
    it('should update an existing model', async () => {
      const registered = await registry.registerModel(mockConfig)
      const updates = {
        metrics: { accuracy: 0.95 }
      }
      
      const updated = await registry.updateModel(registered.id, updates)
      expect(updated).toBeDefined()
      expect(updated!.metrics).toEqual(updates.metrics)
    })

    it('should return null when updating non-existent model', async () => {
      const updated = await registry.updateModel('non-existent', {})
      expect(updated).toBeNull()
    })

    it('should handle update errors', async () => {
      const registered = await registry.registerModel(mockConfig)
      const invalidUpdates = { configId: null }
      
      const updated = await registry.updateModel(registered.id, invalidUpdates as any)
      expect(updated).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to update model:',
        expect.any(Object)
      )
    })
  })

  describe('model deletion', () => {
    it('should delete an existing model', async () => {
      const registered = await registry.registerModel(mockConfig)
      const deleted = await registry.deleteModel(registered.id)
      expect(deleted).toBe(true)
      
      const retrieved = await registry.getModel(registered.id)
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent model', async () => {
      const deleted = await registry.deleteModel('non-existent')
      expect(deleted).toBe(false)
    })

    it('should handle deletion errors', async () => {
      const deleted = await registry.deleteModel('')
      expect(deleted).toBe(false)
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to delete model:',
        expect.any(Object)
      )
    })
  })

  describe('model listing', () => {
    beforeEach(async () => {
      await registry.registerModel({
        ...mockConfig,
        id: 'config1',
        type: 'SEARCH_RANKER'
      })
      await registry.registerModel({
        ...mockConfig,
        id: 'config2',
        type: 'PATTERN_DETECTOR'
      })
    })

    it('should list all models when no type is specified', async () => {
      const models = await registry.listModels()
      expect(models).toHaveLength(2)
    })

    it('should filter models by type', async () => {
      const models = await registry.listModels('SEARCH_RANKER')
      expect(models).toHaveLength(1)
      expect(models[0].configId).toBe('config1')
    })

    it('should return empty array for non-existent type', async () => {
      const models = await registry.listModels('non-existent' as any)
      expect(models).toHaveLength(0)
    })
  })
}) 