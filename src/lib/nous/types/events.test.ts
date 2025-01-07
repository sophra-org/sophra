import { describe, it, expect } from 'vitest'
import { BaseEvent, ModelEvent, SearchEvent, EventProcessor } from './events'
import { EventType } from './core'

describe('Event Types', () => {
  describe('BaseEvent', () => {
    it('should create valid base event', () => {
      const event: BaseEvent = {
        id: 'test-event',
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: { key: 'value' },
        source: 'test-source',
        priority: 1,
        processed: false,
        metadata: { version: '1.0' },
        correlationId: 'corr-123',
      }

      expect(event.id).toBe('test-event')
      expect(event.source).toBe('test-source')
      expect(event.priority).toBe(1)
      expect(event.processed).toBe(false)
      expect(event.metadata?.version).toBe('1.0')
      expect(event.correlationId).toBe('corr-123')
    })

    it('should allow optional fields to be undefined', () => {
      const event: BaseEvent = {
        id: 'test-event',
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
        source: 'test-source',
      }

      expect(event.priority).toBeUndefined()
      expect(event.processed).toBeUndefined()
      expect(event.metadata).toBeUndefined()
      expect(event.correlationId).toBeUndefined()
    })

    it('should enforce required fields', () => {
      // @ts-expect-error - Testing type safety
      const invalidEvent: BaseEvent = {
        id: 'test-event',
        type: EventType.SYSTEM,
        data: {},
      }
      expect(invalidEvent).toBeDefined()

      // @ts-expect-error - Testing type safety
      const invalidEvent2: BaseEvent = {
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
        source: 'test-source',
      }
      expect(invalidEvent2).toBeDefined()
    })
  })

  describe('ModelEvent', () => {
    it('should create valid model event', () => {
      const event: ModelEvent = {
        id: 'model-event',
        type: EventType.MODEL,
        timestamp: new Date(),
        data: { action: 'train' },
        source: 'model-service',
        modelId: 'model-123',
        version: '1.0.0',
        parameters: { learningRate: 0.01 },
        metrics: { accuracy: 0.95 },
        results: [{ prediction: 'class_a' }],
      }

      expect(event.modelId).toBe('model-123')
      expect(event.version).toBe('1.0.0')
      expect(event.parameters.learningRate).toBe(0.01)
      expect(event.metrics.accuracy).toBe(0.95)
      expect(event.results[0].prediction).toBe('class_a')
    })

    it('should enforce model event type', () => {
      const invalidEvent = {
        id: 'model-event',
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
        source: 'model-service',
        modelId: 'model-123',
        version: '1.0.0',
        parameters: {},
        metrics: {},
        results: [],
      }
      expect(invalidEvent.type).not.toBe(EventType.MODEL)
    })
  })

  describe('SearchEvent', () => {
    it('should create valid search event', () => {
      const event: SearchEvent = {
        id: 'search-event',
        type: EventType.SEARCH,
        timestamp: new Date(),
        data: { source: 'user-input' },
        source: 'search-service',
        query: 'test query',
        results: { matches: ['doc1', 'doc2'] },
      }

      expect(event.query).toBe('test query')
      expect(event.results.matches).toEqual(['doc1', 'doc2'])
    })

    it('should enforce search event type', () => {
      const invalidEvent = {
        id: 'search-event',
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
        source: 'search-service',
        query: 'test',
        results: {},
      }
      expect(invalidEvent.type).not.toBe(EventType.SEARCH)
    })
  })

  describe('EventProcessor', () => {
    it('should implement event processor interface', () => {
      class TestProcessor implements EventProcessor {
        process(): void {
          // Implementation
        }

        async batchProcess(events: BaseEvent[]): Promise<BaseEvent[]> {
          return events
        }
      }

      const processor = new TestProcessor()
      expect(processor.process).toBeDefined()
      expect(processor.batchProcess).toBeDefined()
    })

    it('should process events correctly', async () => {
      class TestProcessor implements EventProcessor {
        process(): void {
          // Implementation
        }

        async batchProcess(events: BaseEvent[]): Promise<BaseEvent[]> {
          return events.map(event => ({
            ...event,
            processed: true,
          }))
        }
      }

      const processor = new TestProcessor()
      const events: BaseEvent[] = [
        {
          id: 'event1',
          type: EventType.SYSTEM,
          timestamp: new Date(),
          data: {},
          source: 'test',
        },
        {
          id: 'event2',
          type: EventType.USER,
          timestamp: new Date(),
          data: {},
          source: 'test',
        },
      ]

      const processed = await processor.batchProcess(events)
      expect(processed).toHaveLength(2)
      processed.forEach(event => {
        expect(event.processed).toBe(true)
      })
    })
  })
}) 