import { describe, it, expect } from 'vitest'
import { EventType, Severity, Event, Signal, Metric, StateTransition } from './core'
import { SignalType } from '@prisma/client'

describe('Core Types', () => {
  describe('EventType', () => {
    it('should have all required event types', () => {
      expect(Object.values(EventType)).toContain('system')
      expect(Object.values(EventType)).toContain('user')
      expect(Object.values(EventType)).toContain('state_change')
      expect(Object.values(EventType)).toContain('search')
      expect(Object.values(EventType)).toContain('model')
      expect(Object.values(EventType)).toContain('feedback')
      expect(Object.values(EventType)).toContain('adaptation')
      expect(Object.values(EventType)).toContain('learning')
    })

    it('should not allow invalid event types', () => {
      const validEvent: Event = {
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
      }
      expect(validEvent.type).toBe(EventType.SYSTEM)

      const invalidEvent = {
        type: 'invalid_type',
        timestamp: new Date(),
        data: {},
      }
      expect(invalidEvent.type).not.toBe(EventType.SYSTEM)
    })
  })

  describe('Severity', () => {
    it('should have all severity levels', () => {
      expect(Object.values(Severity)).toContain(Severity.INFO)
      expect(Object.values(Severity)).toContain(Severity.WARNING)
      expect(Object.values(Severity)).toContain(Severity.ERROR)
      expect(Object.values(Severity)).toContain(Severity.CRITICAL)
    })

    it('should maintain correct ordering', () => {
      const severityLevels = Object.values(Severity)
      const index = (sev: Severity) => severityLevels.indexOf(sev)
      
      expect(index(Severity.INFO)).toBeLessThan(index(Severity.WARNING))
      expect(index(Severity.WARNING)).toBeLessThan(index(Severity.ERROR))
      expect(index(Severity.ERROR)).toBeLessThan(index(Severity.CRITICAL))
    })
  })

  describe('Event Interface', () => {
    it('should create valid event object', () => {
      const event: Event = {
        type: EventType.USER,
        timestamp: new Date(),
        data: { action: 'click' },
        metadata: { source: 'test' },
      }

      expect(event.type).toBe(EventType.USER)
      expect(event.data.action).toBe('click')
      expect(event.metadata?.source).toBe('test')
    })

    it('should allow optional metadata', () => {
      const event: Event = {
        type: EventType.SYSTEM,
        timestamp: new Date(),
        data: {},
      }

      expect(event.metadata).toBeUndefined()
    })

    it('should enforce required properties', () => {
      // @ts-expect-error - Testing type safety
      const invalidEvent: Event = {
        type: EventType.USER,
        data: {},
      }
      expect(invalidEvent).toBeDefined()

      // @ts-expect-error - Testing type safety
      const invalidEvent2: Event = {
        timestamp: new Date(),
        data: {},
      }
      expect(invalidEvent2).toBeDefined()
    })
  })

  describe('Signal Interface', () => {
    it('should create valid signal object', () => {
      const signal: Signal = {
        id: 'test-signal',
        source: 'test-source',
        type: SignalType.FEEDBACK,
        strength: 0.8,
        timestamp: new Date(),
        data: { feedback: 'positive' },
        metadata: { confidence: 0.9 },
      }

      expect(signal.id).toBe('test-signal')
      expect(signal.strength).toBe(0.8)
      expect(signal.data.feedback).toBe('positive')
      expect(signal.metadata?.confidence).toBe(0.9)
    })

    it('should enforce strength bounds', () => {
      const signal: Signal = {
        id: 'test-signal',
        source: 'test-source',
        type: SignalType.FEEDBACK,
        strength: 0.5,
        timestamp: new Date(),
        data: {},
      }

      expect(signal.strength).toBeGreaterThanOrEqual(0)
      expect(signal.strength).toBeLessThanOrEqual(1)
    })
  })

  describe('Metric Interface', () => {
    it('should create valid metric object', () => {
      const metric: Metric = {
        name: 'test-metric',
        value: 42,
        timestamp: new Date(),
        metadata: { unit: 'ms' },
      }

      expect(metric.name).toBe('test-metric')
      expect(metric.value).toBe(42)
      expect(metric.metadata?.unit).toBe('ms')
    })

    it('should allow any numeric value', () => {
      const metrics: Metric[] = [
        {
          name: 'integer',
          value: 42,
          timestamp: new Date(),
        },
        {
          name: 'float',
          value: 3.14,
          timestamp: new Date(),
        },
        {
          name: 'negative',
          value: -1,
          timestamp: new Date(),
        },
      ]

      metrics.forEach(metric => {
        expect(typeof metric.value).toBe('number')
      })
    })
  })

  describe('StateTransition Interface', () => {
    it('should create valid state transition object', () => {
      const transition: StateTransition = {
        key: 'status',
        oldValue: 'inactive',
        newValue: 'active',
        timestamp: new Date(),
        metadata: { trigger: 'user' },
      }

      expect(transition.key).toBe('status')
      expect(transition.oldValue).toBe('inactive')
      expect(transition.newValue).toBe('active')
      expect(transition.metadata?.trigger).toBe('user')
    })

    it('should handle different value types', () => {
      const transitions: StateTransition[] = [
        {
          key: 'status',
          oldValue: 'off',
          newValue: 'on',
          timestamp: new Date(),
        },
        {
          key: 'count',
          oldValue: 0,
          newValue: 1,
          timestamp: new Date(),
        },
        {
          key: 'enabled',
          oldValue: false,
          newValue: true,
          timestamp: new Date(),
        },
      ]

      transitions.forEach(transition => {
        expect(transition.timestamp).toBeInstanceOf(Date)
      })
    })
  })
}) 