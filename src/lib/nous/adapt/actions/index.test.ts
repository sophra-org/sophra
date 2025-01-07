import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotifyAction, UpdateStateAction, CompositeAction, ThresholdAdjustmentAction } from '.'
import { RuleContext } from '../types'
import logger from '@/lib/shared/logger'

// Mock logger
vi.mock('@/lib/shared/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('NotifyAction', () => {
  let action: NotifyAction
  let context: RuleContext

  beforeEach(() => {
    vi.clearAllMocks()
    action = new NotifyAction(
      {
        title: 'Test Notification',
        message: 'Test Message',
        severity: 'info',
      },
      logger
    )
    context = {
      timestamp: new Date(),
      eventData: { type: 'test' },
      systemState: {},
      metrics: {},
    }
  })

  it('should log notification with context data', () => {
    action.execute(context)
    expect(logger.info).toHaveBeenCalledWith(
      'Would send notification:',
      expect.objectContaining({
        title: 'Test Notification',
        message: 'Test Message',
        severity: 'info',
        timestamp: context.timestamp,
        eventData: context.eventData,
        metrics: context.metrics,
      })
    )
  })
})

describe('UpdateStateAction', () => {
  let action: UpdateStateAction
  let context: RuleContext

  beforeEach(() => {
    action = new UpdateStateAction({ testKey: 'testValue' })
    context = {
      timestamp: new Date(),
      eventData: {},
      systemState: { existingKey: 'existingValue' },
      metrics: {},
    }
  })

  it('should update system state with new values', () => {
    action.execute(context)
    expect(context.systemState).toEqual({
      existingKey: 'existingValue',
      testKey: 'testValue',
    })
  })

  it('should override existing values', () => {
    action = new UpdateStateAction({ existingKey: 'newValue' })
    action.execute(context)
    expect(context.systemState).toEqual({
      existingKey: 'newValue',
    })
  })
})

describe('CompositeAction', () => {
  let action1: UpdateStateAction
  let action2: UpdateStateAction
  let compositeAction: CompositeAction
  let context: RuleContext

  beforeEach(() => {
    vi.clearAllMocks()
    action1 = new UpdateStateAction({ key1: 'value1' })
    action2 = new UpdateStateAction({ key2: 'value2' })
    compositeAction = new CompositeAction([action1, action2], logger)
    context = {
      timestamp: new Date(),
      eventData: {},
      systemState: {},
      metrics: {},
    }
  })

  it('should execute all actions in sequence', () => {
    compositeAction.execute(context)
    expect(context.systemState).toEqual({
      key1: 'value1',
      key2: 'value2',
    })
  })

  it('should continue execution if one action fails', () => {
    const failingAction = {
      execute: () => {
        throw new Error('Test error')
      },
    }
    compositeAction = new CompositeAction([failingAction, action2], logger)
    compositeAction.execute(context)

    expect(logger.error).toHaveBeenCalledWith('Action failed:', { error: expect.any(Error) })
    expect(context.systemState).toEqual({
      key2: 'value2',
    })
  })
})

describe('ThresholdAdjustmentAction', () => {
  let action: ThresholdAdjustmentAction
  let context: RuleContext

  beforeEach(() => {
    vi.clearAllMocks()
    action = new ThresholdAdjustmentAction(
      {
        metricName: 'testMetric',
        adjustment: 5,
        minValue: 0,
        maxValue: 100,
      },
      logger
    )
    context = {
      timestamp: new Date(),
      eventData: {},
      systemState: {},
      metrics: { testMetric: 50 },
    }
  })

  it('should adjust metric value within bounds', () => {
    action.execute(context)
    expect(context.metrics.testMetric).toBe(55)
    expect(logger.info).toHaveBeenCalledWith('Adjusted testMetric', {
      from: 50,
      to: 55,
    })
  })

  it('should respect minimum value', () => {
    context.metrics.testMetric = -10
    action.execute(context)
    expect(context.metrics.testMetric).toBe(0)
  })

  it('should respect maximum value', () => {
    context.metrics.testMetric = 98
    action.execute(context)
    expect(context.metrics.testMetric).toBe(100)
  })

  it('should initialize metric if not present', () => {
    delete context.metrics.testMetric
    action.execute(context)
    expect(context.metrics.testMetric).toBe(5)
  })
}) 