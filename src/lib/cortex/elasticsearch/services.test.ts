import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ElasticsearchService } from './services'
import { Client } from '@elastic/elasticsearch'
import type { BaseDocument, SearchParams } from './types'
import type { Logger } from '@/lib/shared/types'

// Mock elasticsearch client
vi.mock('@elastic/elasticsearch', () => ({
  Client: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue({}),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue({}),
      refresh: vi.fn(),
      putMapping: vi.fn(),
      getMapping: vi.fn(),
      putSettings: vi.fn(),
      getSettings: vi.fn(),
      stats: vi.fn().mockResolvedValue({
        _all: {
          total: {
            docs: { count: 100 },
            store: { size_in_bytes: 1024 * 1024 * 100 }
          }
        },
        indices: {}
      })
    },
    cluster: {
      health: vi.fn().mockResolvedValue({
        status: 'green',
        cluster_name: 'test-cluster',
        number_of_nodes: 1,
        number_of_data_nodes: 1,
        active_primary_shards: 1,
        active_shards: 1,
        relocating_shards: 0,
        initializing_shards: 0,
        unassigned_shards: 0,
        number_of_pending_tasks: 0,
        task_max_waiting_in_queue_millis: 0
      }),
      stats: vi.fn()
    },
    nodes: {
      stats: vi.fn().mockResolvedValue({
        nodes: {
          test_node: {
            thread_pool: {
              search: {
                active: 5,
                completed: 100,
              },
              write: {
                active: 3,
                completed: 200,
              },
            },
            os: {
              cpu: { percent: 50 },
              cgroup: {
                cpuacct: { usage_nanos: 1024 * 1024 * 500 },
              },
            },
            jvm: {
              mem: {
                heap_used_in_bytes: 1024 * 1024 * 100,
              },
            },
          },
        },
      })
    },
    exists: vi.fn(),
    cat: {
      indices: vi.fn().mockResolvedValue({
        body: [
          {
            health: 'green',
            status: 'open',
            index: 'test-index',
            'docs.count': '100',
            'docs.deleted': '0',
            'store.size': '100mb',
            primaryShards: '1',
            replicaShards: '1',
          },
        ],
      })
    },
    index: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    bulk: vi.fn().mockResolvedValue({
      errors: false,
      items: [{
        index: {
          _index: 'test-index',
          _id: 'test-id',
          status: 200
        }
      }]
    })
  })),
}))

describe('ElasticsearchService', () => {
  let esService: ElasticsearchService
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    service: 'test',
    http: vi.fn(),
    verbose: vi.fn(),
    silent: false,
    format: {},
    levels: {},
    level: 'info',
  } as unknown as Logger

  beforeEach(() => {
    vi.clearAllMocks()
    esService = new ElasticsearchService({
      environment: 'test',
      logger: mockLogger,
      config: {
        node: 'http://localhost:9200',
      },
    })
  })

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'ping').mockRejectedValue(new Error('Connection failed'))

      const health = await esService.testService()

      expect(health.operational).toBe(false)
      expect(health.errors).toHaveLength(1)
    })

    it('should handle index creation errors', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue({ statusCode: 404 } as any)
      vi.spyOn(mockClient.indices, 'create').mockRejectedValue(new Error('Creation failed'))

      await expect(
        esService.createIndex('test-index', { body: {} })
      ).rejects.toThrow('Creation failed')
    })
  })

  describe('index operations', () => {
    it('should check if index exists', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue({ statusCode: 200 } as any)

      const exists = await esService.indexExists('test-index')
      expect(exists).toBe(true)
    })

    it('should create index with mappings', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue({ statusCode: 404 } as any)
      vi.spyOn(mockClient.indices, 'create').mockResolvedValue({} as any)

      const mappings = {
        properties: {
          field: { type: 'text' },
        },
      }

      await esService.createIndex('test-index', { body: { mappings } })

      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: 'test-index',
        body: { mappings },
      })
    })

    it('should delete index', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient.indices, 'exists').mockResolvedValue({ statusCode: 200 } as any)
      mockClient.indices.delete = vi.fn().mockResolvedValue({} as any)

      await esService.deleteIndex('test-index')

      expect(mockClient.indices.delete).toHaveBeenCalledWith({
        index: 'test-index',
      })
    })
  })

  describe('document operations', () => {
    const mockDoc: BaseDocument = {
      id: 'test-id',
      title: 'Test Document',
      content: 'Test content',
      abstract: '',
      authors: [],
      source: '',
      tags: [],
      metadata: {},
      processing_status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      embeddings: [],
      evaluationScore: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      evaluation_score: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      type: 'test',
    }

    it('should index document', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'bulk').mockResolvedValue({
        errors: false,
        items: [{
          index: {
            _index: 'test-index',
            _id: 'test-id',
            status: 200
          }
        }]
      } as any)

      await esService.bulk([
        { index: { _index: 'test-index' } },
        mockDoc
      ])

      expect(mockClient.bulk).toHaveBeenCalledWith({
        body: [
          { index: { _index: 'test-index' } },
          mockDoc
        ]
      })
    })

    it('should update document', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'bulk').mockResolvedValue({
        errors: false,
        items: [{
          update: {
            _index: 'test-index',
            _id: 'test-id',
            status: 200
          }
        }]
      } as any)

      const update = { title: 'Updated Title' }
      await esService.bulk([
        { update: { _index: 'test-index', _id: 'test-id' } },
        { doc: update }
      ])

      expect(mockClient.bulk).toHaveBeenCalledWith({
        body: [
          { update: { _index: 'test-index', _id: 'test-id' } },
          { doc: update }
        ]
      })
    })

    it('should delete document', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'bulk').mockResolvedValue({
        errors: false,
        items: [{
          delete: {
            _index: 'test-index',
            _id: 'test-id',
            status: 200
          }
        }]
      } as any)

      await esService.bulk([
        { delete: { _index: 'test-index', _id: 'test-id' } }
      ])

      expect(mockClient.bulk).toHaveBeenCalledWith({
        body: [
          { delete: { _index: 'test-index', _id: 'test-id' } }
        ]
      })
    })
  })

  describe('search operations', () => {
    const mockDoc: BaseDocument = {
      id: 'test-id',
      title: 'Test Document',
      content: 'Test content',
      abstract: '',
      authors: [],
      source: '',
      tags: [],
      metadata: {},
      processing_status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      embeddings: [],
      evaluationScore: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      evaluation_score: {
        actionability: 0,
        aggregate: 0,
        clarity: 0,
        credibility: 0,
        relevance: 0,
      },
      type: 'test',
    }

    it('should perform basic search', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'search').mockResolvedValue({
        hits: {
          total: { value: 1, relation: 'eq' },
          hits: [
            {
              _id: 'test-id',
              _score: 1.0,
              _source: mockDoc,
            },
          ],
        },
        took: 5,
      } as any)

      const searchParams = {
        query: {
          multi_match: {
            query: 'test',
            fields: ['title', 'content'],
          },
        },
      }

      const result = await esService.search('test-index', searchParams)

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'test-index',
        body: searchParams,
      })
      expect(result.hits.hits).toHaveLength(1)
      expect(result.hits.hits[0]._source).toEqual(mockDoc)
    })

    it('should perform search with aggregations', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'search').mockResolvedValue({
        hits: {
          total: { value: 1, relation: 'eq' },
          hits: [
            {
              _id: 'test-id',
              _score: 1.0,
              _source: mockDoc,
            },
          ],
        },
        took: 5,
        aggregations: {
          tags: {
            buckets: [
              { key: 'test', doc_count: 1 },
            ],
          },
        },
      } as any)

      const searchParams = {
        query: {
          multi_match: {
            query: 'test',
            fields: ['title', 'content'],
          },
        },
        aggregations: {
          tags: {
            terms: {
              field: 'tags.keyword',
              size: 10,
            },
          },
        },
      }

      const result = await esService.search('test-index', searchParams)

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'test-index',
        body: searchParams,
      })
      expect(result.hits.hits).toHaveLength(1)
      expect(result.hits.hits[0]._source).toEqual(mockDoc)
      expect(result.aggregations).toBeDefined()
      expect((result.aggregations?.tags as { buckets: Array<{ key: string; doc_count: number }> }).buckets).toHaveLength(1)
    })
  })

  describe('health checks', () => {
    it('should return cluster health', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'ping').mockResolvedValue({} as any)
      vi.spyOn(mockClient.cluster, 'health').mockResolvedValue({
        status: 'green',
        cluster_name: 'test-cluster',
        number_of_nodes: 1,
        number_of_data_nodes: 1,
        active_primary_shards: 1,
        active_shards: 1,
        relocating_shards: 0,
        initializing_shards: 0,
        unassigned_shards: 0,
        number_of_pending_tasks: 0,
        task_max_waiting_in_queue_millis: 0,
      } as any)
      vi.spyOn(mockClient.nodes, 'stats').mockResolvedValue({
        nodes: {
          test_node: {
            thread_pool: {
              search: {
                active: 5,
                completed: 100,
              },
              write: {
                active: 3,
                completed: 200,
              },
            },
            os: {
              cpu: { percent: 50 },
              cgroup: {
                cpuacct: { usage_nanos: 1024 * 1024 * 500 },
              },
            },
            jvm: {
              mem: {
                heap_used_in_bytes: 1024 * 1024 * 100,
              },
            },
          },
        },
      } as any)
      vi.spyOn(mockClient.indices, 'stats').mockResolvedValue({
        _all: {
          total: {
            docs: { count: 100 },
            store: { size_in_bytes: 1024 * 1024 * 100 }
          }
        },
        indices: {}
      } as any)

      const health = await esService.testService()

      expect(health.operational).toBe(true)
      expect(health.metrics.cluster.status).toBe('green')
      expect(health.metrics.cluster.nodes).toBe(1)
      expect(health.metrics.cluster.dataNodes).toBe(1)
    })

    it('should return node stats', async () => {
      const mockClient = esService['client'] as jest.Mocked<Client>
      vi.spyOn(mockClient, 'ping').mockResolvedValue({} as any)
      vi.spyOn(mockClient.cluster, 'health').mockResolvedValue({
        status: 'green',
        cluster_name: 'test-cluster',
        number_of_nodes: 1,
        number_of_data_nodes: 1,
        active_primary_shards: 1,
        active_shards: 1,
        relocating_shards: 0,
        initializing_shards: 0,
        unassigned_shards: 0,
        number_of_pending_tasks: 0,
        task_max_waiting_in_queue_millis: 0,
      } as any)
      vi.spyOn(mockClient.nodes, 'stats').mockResolvedValue({
        nodes: {
          test_node: {
            thread_pool: {
              search: {
                active: 5,
                completed: 100,
              },
              write: {
                active: 3,
                completed: 200,
              },
            },
            os: {
              cpu: { percent: 50 },
              cgroup: {
                cpuacct: { usage_nanos: 1024 * 1024 * 500 },
              },
            },
            jvm: {
              mem: {
                heap_used_in_bytes: 1024 * 1024 * 100,
              },
            },
          },
        },
      } as any)
      vi.spyOn(mockClient.indices, 'stats').mockResolvedValue({
        _all: {
          total: {
            docs: { count: 100 },
            store: { size_in_bytes: 1024 * 1024 * 100 }
          }
        },
        indices: {}
      } as any)

      const health = await esService.testService()

      expect(health.operational).toBe(true)
      expect(health.metrics.performance.queryLatency).toBeGreaterThan(0)
      expect(health.metrics.performance.indexingLatency).toBeGreaterThan(0)
      expect(health.metrics.performance.searchRate).toBeGreaterThan(0)
      expect(health.metrics.performance.indexingRate).toBeGreaterThan(0)
      expect(health.metrics.performance.cpuUsage).toBe(50)
      expect(health.metrics.performance.memoryUsage).toBe('100mb')
      expect(health.metrics.performance.diskUsage).toBe('500mb')
    })
  })
})