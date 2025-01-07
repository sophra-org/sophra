import { describe, it, expect, beforeEach } from 'vitest'
import { RegistryStore } from './store'

interface TestData {
  value: string
}

describe('RegistryStore', () => {
  let store: RegistryStore

  beforeEach(() => {
    store = new RegistryStore()
  })

  it('should register and retrieve entries', () => {
    const entry = {
      id: '1',
      type: 'test',
      name: 'test-entry',
      status: 'ACTIVE',
      metadata: { value: 'test' },
      config: { value: 'test-data' },
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      description: null,
      lastUsedAt: null
    }

    store.register(entry)
    const retrieved = store.get<TestData>('1')
    expect(retrieved).toBeDefined()
    expect(retrieved?.config).toEqual({ value: 'test-data' })
  })

  it('should update entries', () => {
    const entry = {
      id: '1',
      type: 'test',
      name: 'test-entry',
      status: 'ACTIVE',
      metadata: { value: 'test' },
      config: { value: 'initial' },
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      description: null,
      lastUsedAt: null
    }

    store.register(entry)

    const update = {
      metadata: { value: 'updated' },
      config: { value: 'updated-data' }
    }

    store.update<TestData>('1', update)
    const updated = store.get<TestData>('1')
    expect(updated?.config).toEqual({ value: 'updated-data' })
  })

  it('should delete entries', () => {
    const entry = {
      id: '1',
      type: 'test',
      name: 'test-entry',
      status: 'ACTIVE',
      metadata: { value: 'test' },
      config: { value: 'test-data' },
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      description: null,
      lastUsedAt: null
    }

    store.register(entry)
    expect(store.get('1')).toBeDefined()

    store.delete('1')
    expect(store.get('1')).toBeUndefined()
  })

  it('should get entries by tag', () => {
    const entry = {
      id: '1',
      type: 'test',
      name: 'test-entry',
      status: 'ACTIVE',
      metadata: { value: 'test' },
      config: { value: 'test-data' },
      tags: ['test-tag'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
      description: null,
      lastUsedAt: null
    }

    store.register(entry)
    const entries = store.getByTag('test-tag')
    expect(entries).toHaveLength(1)
    expect(entries[0].config).toEqual({ value: 'test-data' })
  })

  it('should list all entries', () => {
    const entries = [
      {
        id: '1',
        type: 'test1',
        name: 'test-entry-1',
        status: 'ACTIVE',
        metadata: { value: 'test1' },
        config: { value: 'data1' },
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        description: null,
        lastUsedAt: null
      },
      {
        id: '2',
        type: 'test2',
        name: 'test-entry-2',
        status: 'ACTIVE',
        metadata: { value: 'test2' },
        config: { value: 'data2' },
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0',
        description: null,
        lastUsedAt: null
      }
    ]

    entries.forEach(entry => store.register(entry))
    const listed = store.listEntries()
    expect(listed).toHaveLength(2)
  })
}) 