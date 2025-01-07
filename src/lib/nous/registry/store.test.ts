import { describe, it, expect, beforeEach } from 'vitest'
import { RegistryStore, RegistryEntry } from './store'

interface TestData {
  value: string
}

describe('RegistryStore', () => {
  let store: RegistryStore
  let testEntry: RegistryEntry<TestData>
  let now: Date

  beforeEach(() => {
    store = new RegistryStore()
    now = new Date()
    testEntry = {
      id: 'test-1',
      name: 'test-entry',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      metadata: { description: 'Test entry' },
      data: { value: 'test' },
      tags: ['test', 'example'],
      dependencies: [],
    }
  })

  describe('registration', () => {
    it('should register new entry', () => {
      store.register(testEntry)
      const retrieved = store.get<TestData>(testEntry.id)
      expect(retrieved).toEqual(testEntry)
    })

    it('should prevent duplicate registration', () => {
      store.register(testEntry)
      expect(() => store.register(testEntry)).toThrow(
        `Entry with id ${testEntry.id} already exists`
      )
    })

    it('should track versions', () => {
      store.register(testEntry)
      const latestVersion = store.getLatestVersion<TestData>(testEntry.name)
      expect(latestVersion).toEqual(testEntry)
    })

    it('should handle multiple versions', () => {
      const v1 = { ...testEntry, version: '1.0.0', id: 'test-1', createdAt: new Date(now.getTime() - 1000) }
      const v2 = { ...testEntry, version: '2.0.0', id: 'test-2', createdAt: new Date(now.getTime() + 1000) }
      
      store.register(v1)
      store.register(v2)
      
      const latest = store.getLatestVersion<TestData>(testEntry.name)
      expect(latest).toEqual(v2)
    })

    it('should prevent version conflicts', () => {
      const v1 = { ...testEntry, version: '1.0.0', id: 'test-1' }
      const v2 = { ...testEntry, version: '1.0.0', id: 'test-2' }
      
      store.register(v1)
      expect(() => store.register(v2)).toThrow(
        `Entry with version ${v2.version} already exists for ${v2.name}`
      )
    })
  })

  describe('updates', () => {
    beforeEach(() => {
      store.register(testEntry)
    })

    it('should update existing entry', () => {
      const beforeUpdate = new Date()
      const updates = {
        metadata: { description: 'Updated description' },
        data: { value: 'updated' }
      }
      
      const updated = store.update<TestData>(testEntry.id, updates)
      expect(updated).toBeDefined()
      expect(updated!.metadata).toEqual(updates.metadata)
      expect(updated!.data).toEqual(updates.data)
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should return undefined when updating non-existent entry', () => {
      const updated = store.update<TestData>('non-existent', {})
      expect(updated).toBeUndefined()
    })

    it('should preserve unmodified fields', () => {
      const updates = { metadata: { description: 'Updated description' } }
      const updated = store.update<TestData>(testEntry.id, updates)
      expect(updated!.data).toEqual(testEntry.data)
      expect(updated!.tags).toEqual(testEntry.tags)
    })
  })

  describe('dependency validation', () => {
    it('should validate dependencies during registration', () => {
      const dep = { ...testEntry, id: 'dep-1', version: '1.0.0' }
      const entryWithDeps = { ...testEntry, id: 'entry-1', version: '2.0.0', dependencies: ['dep-1'] }
      
      expect(() => store.register(entryWithDeps)).toThrow(
        'Dependency dep-1 not found'
      )

      store.register(dep)
      expect(() => store.register(entryWithDeps)).not.toThrow()
    })

    it('should prevent circular dependencies', () => {
      const entry1 = { ...testEntry, id: 'entry-1', version: '1.0.0', dependencies: [] }
      const entry2 = { ...testEntry, id: 'entry-2', version: '2.0.0', dependencies: ['entry-1'] }
      
      store.register(entry1)
      store.register(entry2)

      // Now try to update entry1 to depend on entry2, creating a cycle
      expect(() => store.update('entry-1', { dependencies: ['entry-2'] })).toThrow('Circular dependency detected')
    })

    it('should validate dependencies during updates', () => {
      const entry1 = { ...testEntry, id: 'entry-1' }
      store.register(entry1)
      
      const update = {
        dependencies: ['non-existent']
      }
      
      expect(() => store.update('entry-1', update)).toThrow(
        'Dependency non-existent not found'
      )
    })
  })

  describe('tag management', () => {
    it('should get entries by tag', () => {
      store.register(testEntry)
      const entries = store.getByTag<TestData>('test')
      expect(entries).toHaveLength(1)
      expect(entries[0]).toEqual(testEntry)
    })

    it('should handle multiple entries with same tag', () => {
      const anotherEntry = {
        ...testEntry,
        id: 'test-2',
        version: '2.0.0',
        tags: ['test', 'other'],
      }
      store.register(testEntry)
      store.register(anotherEntry)

      const entries = store.getByTag<TestData>('test')
      expect(entries).toHaveLength(2)
      expect(entries).toContainEqual(testEntry)
      expect(entries).toContainEqual(anotherEntry)
    })

    it('should return empty array for non-existent tag', () => {
      const entries = store.getByTag<TestData>('non-existent')
      expect(entries).toHaveLength(0)
    })
  })

  describe('deletion', () => {
    beforeEach(() => {
      store.register(testEntry)
    })

    it('should delete existing entry', () => {
      const deleted = store.delete(testEntry.id)
      expect(deleted).toBe(true)
      expect(store.get(testEntry.id)).toBeUndefined()
    })

    it('should return false when deleting non-existent entry', () => {
      const deleted = store.delete('non-existent')
      expect(deleted).toBe(false)
    })

    it('should clean up version tracking', () => {
      store.delete(testEntry.id)
      const latest = store.getLatestVersion<TestData>(testEntry.name)
      expect(latest).toBeUndefined()
    })

    it('should clean up tag indices', () => {
      store.delete(testEntry.id)
      const taggedEntries = store.getByTag<TestData>('test')
      expect(taggedEntries).toHaveLength(0)
    })
  })

  describe('listing', () => {
    it('should list all entries', () => {
      store.register(testEntry)
      const entries = store.listEntries<TestData>()
      expect(entries).toHaveLength(1)
      expect(entries[0]).toEqual(testEntry)
    })

    it('should handle multiple entries', () => {
      const entries = [
        testEntry,
        { ...testEntry, id: 'test-2', name: 'another-entry' },
        { ...testEntry, id: 'test-3', name: 'third-entry' },
      ]

      entries.forEach(entry => store.register(entry))
      const listed = store.listEntries<TestData>()
      expect(listed).toHaveLength(entries.length)
      entries.forEach(entry => {
        expect(listed).toContainEqual(entry)
      })
    })

    it('should return empty array when no entries exist', () => {
      const entries = store.listEntries<TestData>()
      expect(entries).toHaveLength(0)
    })
  })
}) 