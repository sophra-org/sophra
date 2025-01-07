import { describe, it, expect, beforeEach } from 'vitest'
import { MetadataManager, MetadataSchema } from './metadata'
import { z } from 'zod'

describe('MetadataManager', () => {
  let manager: MetadataManager

  const testSchema: MetadataSchema = {
    requiredFields: ['name', 'version'],
    optionalFields: ['description', 'tags', 'config'],
    fieldTypes: {
      name: z.string(),
      version: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      config: z.object({
        enabled: z.boolean(),
        settings: z.record(z.string(), z.any()).optional()
      }).optional()
    },
    validators: {
      version: [
        (v) => typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v),
      ],
    },
  }

  beforeEach(() => {
    manager = new MetadataManager()
    manager.registerSchema('test', testSchema)
  })

  describe('schema management', () => {
    it('should register schema successfully', () => {
      const newSchema: MetadataSchema = {
        requiredFields: ['id'],
        optionalFields: ['data'],
        fieldTypes: {
          id: z.string(),
          data: z.any(),
        },
        validators: {},
      }

      manager.registerSchema('new-schema', newSchema)
      
      // Verify by using it for validation
      const validMetadata = { id: 'test-id' }
      expect(() => 
        manager.storeMetadata('entry1', validMetadata, 'new-schema')
      ).not.toThrow()
    })

    it('should throw error when validating with non-existent schema', () => {
      expect(() =>
        manager.validateMetadata('non-existent', {})
      ).toThrow('Schema non-existent not found')
    })
  })

  describe('metadata validation', () => {
    it('should validate metadata against schema', () => {
      const validMetadata = {
        name: 'test-model',
        version: '1.0.0',
        description: 'Test model',
      }

      expect(manager.validateMetadata('test', validMetadata)).toBe(true)
    })

    it('should validate metadata with optional fields', () => {
      const validMetadata = {
        name: 'test-model',
        version: '1.0.0',
        description: 'Test model',
        tags: ['test', 'model'],
        config: {
          enabled: true,
          settings: {
            timeout: 1000
          }
        }
      }

      expect(manager.validateMetadata('test', validMetadata)).toBe(true)
    })

    it('should validate metadata with missing optional fields', () => {
      const validMetadata = {
        name: 'test-model',
        version: '1.0.0',
        // description and tags are optional
      }

      expect(manager.validateMetadata('test', validMetadata)).toBe(true)
    })

    it('should fail validation when required fields are missing', () => {
      const invalidMetadata = {
        name: 'test-model',
        // missing version field
      }

      expect(manager.validateMetadata('test', invalidMetadata)).toBe(false)
    })

    it('should fail validation when field types are incorrect', () => {
      const invalidMetadata = {
        name: 'test-model',
        version: 123, // should be string
      }

      expect(manager.validateMetadata('test', invalidMetadata)).toBe(false)
    })

    it('should fail validation when custom validators fail', () => {
      const invalidMetadata = {
        name: 'test-model',
        version: 'invalid-version', // doesn't match semver pattern
      }

      expect(manager.validateMetadata('test', invalidMetadata)).toBe(false)
    })

    it('should fail validation when nested object is invalid', () => {
      const invalidMetadata = {
        name: 'test-model',
        version: '1.0.0',
        config: {
          enabled: 'true', // should be boolean
          settings: {
            timeout: 1000
          }
        }
      }

      expect(manager.validateMetadata('test', invalidMetadata)).toBe(false)
    })

    it('should ignore unknown fields during validation', () => {
      const metadataWithUnknownFields = {
        name: 'test-model',
        version: '1.0.0',
        unknownField: 'some value',
        anotherUnknown: {
          nested: true
        }
      }

      expect(manager.validateMetadata('test', metadataWithUnknownFields)).toBe(true)
    })
  })

  describe('metadata storage operations', () => {
    const validMetadata = {
      name: 'test-model',
      version: '1.0.0',
      description: 'Test model',
    }

    it('should store metadata successfully', () => {
      manager.storeMetadata('entry1', validMetadata, 'test')
      const stored = manager.getMetadata('entry1')
      
      expect(stored).toBeDefined()
      expect(stored?.name).toBe('test-model')
      expect(stored?.version).toBe('1.0.0')
      expect(stored?.lastUpdated).toBeDefined()
    })

    it('should throw error when storing invalid metadata', () => {
      const invalidMetadata = {
        name: 'test-model',
        // missing version
      }

      expect(() =>
        manager.storeMetadata('entry1', invalidMetadata, 'test')
      ).toThrow('Metadata validation failed')
    })

    it('should update metadata successfully', () => {
      manager.storeMetadata('entry1', validMetadata, 'test')
      
      const updates = {
        description: 'Updated description',
      }

      expect(manager.updateMetadata('entry1', updates, 'test')).toBe(true)
      
      const updated = manager.getMetadata('entry1')
      expect(updated?.description).toBe('Updated description')
      expect(updated?.lastUpdated).toBeDefined()
    })

    it('should fail update with invalid metadata', () => {
      manager.storeMetadata('entry1', validMetadata, 'test')
      
      const invalidUpdates = {
        version: 'invalid-version',
      }

      expect(manager.updateMetadata('entry1', invalidUpdates, 'test')).toBe(false)
    })

    it('should delete metadata successfully', () => {
      manager.storeMetadata('entry1', validMetadata)
      expect(manager.deleteMetadata('entry1')).toBe(true)
      expect(manager.getMetadata('entry1')).toBeUndefined()
    })

    it('should handle deletion of non-existent entry', () => {
      expect(manager.deleteMetadata('non-existent')).toBe(false)
    })
  })

  describe('metadata listing', () => {
    beforeEach(() => {
      manager.storeMetadata('entry1', {
        name: 'model1',
        version: '1.0.0',
        tags: ['production'] as string[],
      })
      manager.storeMetadata('entry2', {
        name: 'model2',
        version: '2.0.0',
        tags: ['staging'] as string[],
      })
    })

    it('should list all metadata entries', () => {
      const allEntries = manager.listMetadata()
      expect(Object.keys(allEntries)).toHaveLength(2)
      expect(allEntries.entry1.name).toBe('model1')
      expect(allEntries.entry2.name).toBe('model2')
    })

    it('should filter metadata entries', () => {
      const filtered = manager.listMetadata(
        (metadata: Record<string, unknown>) => 
          Array.isArray(metadata.tags) && metadata.tags.includes('production')
      )
      
      expect(Object.keys(filtered)).toHaveLength(1)
      expect(filtered.entry1.name).toBe('model1')
    })

    it('should return empty object when no entries match filter', () => {
      const filtered = manager.listMetadata(
        (metadata: Record<string, unknown>) => 
          Array.isArray(metadata.tags) && metadata.tags.includes('non-existent')
      )
      
      expect(Object.keys(filtered)).toHaveLength(0)
    })
  })
}) 