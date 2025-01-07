import { describe, it, expect, beforeEach } from 'vitest'
import { ModelRegistry, ModelConfigSchema, ModelConfig } from './base'

describe('ModelConfigSchema', () => {
  it('should validate valid model config', () => {
    const validConfig = {
      id: 'test-model',
      baseModel: 'sophra-base',
      version: '1.0.0',
      parameters: { learningRate: 0.001 },
      metadata: { description: 'Test model' },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ready' as const,
    }

    const result = ModelConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should apply default status', () => {
    const configWithoutStatus = {
      id: 'test-model',
      baseModel: 'sophra-base',
      version: '1.0.0',
      parameters: {},
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ModelConfigSchema.safeParse(configWithoutStatus)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('initializing')
    }
  })

  it('should reject invalid status', () => {
    const invalidConfig = {
      id: 'test-model',
      baseModel: 'sophra-base',
      version: '1.0.0',
      parameters: {},
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'invalid-status',
    }

    const result = ModelConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })

  it('should require all mandatory fields', () => {
    const incompleteConfig = {
      id: 'test-model',
      // Missing baseModel and version
      parameters: {},
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ModelConfigSchema.safeParse(incompleteConfig)
    expect(result.success).toBe(false)
  })
})

describe('ModelRegistry', () => {
  let registry: ModelRegistry
  let testModel: ModelConfig

  beforeEach(() => {
    registry = new ModelRegistry()
    testModel = {
      id: 'test-model',
      baseModel: 'sophra-base',
      version: '1.0.0',
      parameters: { learningRate: 0.001 },
      metadata: { description: 'Test model' },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'ready',
    }
  })

  describe('initialization', () => {
    it('should initialize with base model', () => {
      const baseModel = registry.getModel('base_v1')
      expect(baseModel).toBeDefined()
      expect(baseModel?.baseModel).toBe('sophra-base')
      expect(baseModel?.status).toBe('ready')
    })
  })

  describe('model management', () => {
    it('should register new model', () => {
      registry.registerModel(testModel)
      const model = registry.getModel(testModel.id)
      expect(model).toEqual(testModel)
    })

    it('should prevent duplicate registration', () => {
      registry.registerModel(testModel)
      expect(() => registry.registerModel(testModel)).toThrow(
        `Model ${testModel.id} already exists`
      )
    })

    it('should update existing model', () => {
      registry.registerModel(testModel)
      const updates = {
        parameters: { learningRate: 0.002 },
        status: 'training' as const,
      }

      const updated = registry.updateModel(testModel.id, updates)
      expect(updated.parameters.learningRate).toBe(0.002)
      expect(updated.status).toBe('training')
      expect(updated.updatedAt).not.toBe(testModel.updatedAt)
    })

    it('should throw error when updating non-existent model', () => {
      expect(() =>
        registry.updateModel('non-existent', { status: 'ready' })
      ).toThrow('Model non-existent not found')
    })

    it('should list all models', () => {
      registry.registerModel(testModel)
      const models = registry.listModels()
      expect(models).toHaveLength(2) // base_v1 + testModel
      expect(models.find(m => m.id === testModel.id)).toEqual(testModel)
    })

    it('should delete model', () => {
      registry.registerModel(testModel)
      const deleted = registry.deleteModel(testModel.id)
      expect(deleted).toBe(true)
      expect(registry.getModel(testModel.id)).toBeUndefined()
    })

    it('should return false when deleting non-existent model', () => {
      const deleted = registry.deleteModel('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('model retrieval', () => {
    it('should return undefined for non-existent model', () => {
      const model = registry.getModel('non-existent')
      expect(model).toBeUndefined()
    })

    it('should retrieve model by id', () => {
      registry.registerModel(testModel)
      const model = registry.getModel(testModel.id)
      expect(model).toEqual(testModel)
    })
  })
}) 