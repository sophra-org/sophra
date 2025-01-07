import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RuleRegistry, ThresholdCondition, EventCondition } from '.'
import { Rule, RuleContext, RulePriority } from '../types'
import logger from '@/lib/shared/logger'

// Mock logger
vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    service: 'test-service',
  },
}))

describe('RuleRegistry', () => {
  let registry: RuleRegistry
  let mockRule: Rule
  let context: RuleContext

  beforeEach(() => {
    vi.clearAllMocks()
    registry = new RuleRegistry()
    mockRule = {
      name: 'test-rule',
      description: 'Test rule',
      priority: RulePriority.MEDIUM,
      conditions: [],
      actions: [],
      enabled: true,
      evaluate: vi.fn().mockReturnValue(true),
      execute: vi.fn(),
    }
    context = {
      timestamp: new Date(),
      eventData: {},
      systemState: {},
      metrics: {},
    }
  })

  it('should register and retrieve rules', () => {
    registry.register(mockRule)
    expect(registry.getRuleCount()).toBe(1)
    expect(registry.getRule('test-rule')).toBe(mockRule)
  })

  it('should unregister rules', () => {
    registry.register(mockRule)
    registry.unregister('test-rule')
    expect(registry.getRuleCount()).toBe(0)
    expect(registry.getRule('test-rule')).toBeUndefined()
  })

  it('should execute triggered rules in priority order', async () => {
    const highPriorityRule = {
      ...mockRule,
      name: 'high-priority',
      priority: RulePriority.HIGH,
    }
    const lowPriorityRule = {
      ...mockRule,
      name: 'low-priority',
      priority: RulePriority.LOW,
    }

    registry.register(lowPriorityRule)
    registry.register(highPriorityRule)

    await registry.executeTriggered(context)

    expect(highPriorityRule.execute).toHaveBeenCalled()
    expect(lowPriorityRule.execute).toHaveBeenCalled()
  })

  it('should handle rule execution errors', async () => {
    const failingRule = {
      ...mockRule,
      execute: vi.fn().mockRejectedValue(new Error('Test error')),
    }
    registry.register(failingRule)

    await registry.executeTriggered(context)

    expect(logger.error).toHaveBeenCalledWith(
      'Rule execution failed: test-rule',
      { error: expect.any(Error) }
    )
  })

  it('should only execute enabled rules', async () => {
    const disabledRule = {
      ...mockRule,
      enabled: false,
    }
    registry.register(disabledRule)

    await registry.executeTriggered(context)

    expect(disabledRule.execute).not.toHaveBeenCalled()
  })
})

describe('ThresholdCondition', () => {
  let context: RuleContext

  beforeEach(() => {
    context = {
      timestamp: new Date(),
      eventData: {},
      systemState: {},
      metrics: { testMetric: 50 },
    }
  })

  it.each([
    ['gt', 40, true],
    ['gt', 60, false],
    ['lt', 60, true],
    ['lt', 40, false],
    ['gte', 50, true],
    ['gte', 51, false],
    ['lte', 50, true],
    ['lte', 49, false],
    ['eq', 50, true],
    ['eq', 51, false],
  ])('should evaluate %s operator correctly', (operator, threshold, expected) => {
    const condition = new ThresholdCondition(
      'testMetric',
      threshold,
      operator as any
    )
    expect(condition.evaluate(context)).toBe(expected)
  })

  it('should return false for undefined metrics', () => {
    const condition = new ThresholdCondition('nonexistentMetric', 50)
    expect(condition.evaluate(context)).toBe(false)
  })
})

describe('EventCondition', () => {
  let context: RuleContext

  beforeEach(() => {
    context = {
      timestamp: new Date(),
      eventData: {
        type: 'test-event',
        property1: 'value1',
        property2: 'value2',
      },
      systemState: {},
      metrics: {},
    }
  })

  it('should match event type and properties', () => {
    const condition = new EventCondition('test-event', {
      property1: 'value1',
    })
    expect(condition.evaluate(context)).toBe(true)
  })

  it('should not match different event type', () => {
    const condition = new EventCondition('different-event')
    expect(condition.evaluate(context)).toBe(false)
  })

  it('should not match when properties differ', () => {
    const condition = new EventCondition('test-event', {
      property1: 'different-value',
    })
    expect(condition.evaluate(context)).toBe(false)
  })

  it('should match when no properties specified', () => {
    const condition = new EventCondition('test-event')
    expect(condition.evaluate(context)).toBe(true)
  })
}) 