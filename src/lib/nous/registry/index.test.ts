import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Registry } from './index'
import { RegistryStore } from './store'
import { Version, VersionManager, VersionState } from './version'

// Mock dependencies
vi.mock('./store')
vi.mock('./metadata')
vi.mock('./version', () => ({
  Version: vi.fn(),
  VersionState: {
    DRAFT: "draft",
    ACTIVE: "active",
    DEPRECATED: "deprecated",
    ARCHIVED: "archived"
  },
  VersionManager: vi.fn(() => ({
    createVersion: vi.fn(() => new Version(0, 1, 0, VersionState.DRAFT, new Date(), new Date()))
  }))
}))

// Mock Prisma types and validation
vi.mock('@prisma/client', () => ({
  ModelConfig: vi.fn(),
  ModelVersion: vi.fn(),
  Prisma: {
    JsonValue: vi.fn()
  }
}))

vi.mock('lib/shared/database/validation/generated', () => ({
  ModelVersionSchema: {
    parse: vi.fn(data => data)
  }
}))

// Define types to match Prisma schema
type ModelType = "SEARCH_RANKER" | "PATTERN_DETECTOR" | "QUERY_OPTIMIZER" | "FEEDBACK_ANALYZER" | "OPENAI_FINE_TUNED";

interface ModelConfig {
  id: string;
  type: ModelType;
  hyperparameters: Record<string, any>;
  features: string[];
  trainingParams: Record<string, any>;
}

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
      
      expect(result).toMatchObject({
        configId: 'config-1',
        createdAt: expect.any(Date),
        metrics: {},
        artifactPath: expect.stringMatching(/^models\/model_\d+$/),
        parentVersion: null
      })
      // Verify id is a valid cuid
      expect(result.id).toMatch(/^c[a-z0-9]{24}$/)
    })

    it('should throw error for invalid config', async () => {
      await expect(registry.registerModel({} as any))
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
