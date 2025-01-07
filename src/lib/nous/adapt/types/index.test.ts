import { describe, it, expect } from 'vitest'
import { RuleContextSchema, RulePriority } from '.'

describe('RuleContextSchema', () => {
  it('should validate valid rule context', () => {
    const validContext = {
      timestamp: new Date(),
      eventData: { type: 'test' },
      systemState: { key: 'value' },
      metrics: { metric1: 1, metric2: 2 },
      metadata: { source: 'test' },
    }

    const result = RuleContextSchema.safeParse(validContext)
    expect(result.success).toBe(true)
  })

  it('should validate context without optional metadata', () => {
    const contextWithoutMetadata = {
      timestamp: new Date(),
      eventData: { type: 'test' },
      systemState: { key: 'value' },
      metrics: { metric1: 1 },
    }

    const result = RuleContextSchema.safeParse(contextWithoutMetadata)
    expect(result.success).toBe(true)
  })

  it('should reject invalid timestamp', () => {
    const invalidContext = {
      timestamp: 'not-a-date',
      eventData: {},
      systemState: {},
      metrics: {},
    }

    const result = RuleContextSchema.safeParse(invalidContext)
    expect(result.success).toBe(false)
  })

  it('should reject non-numeric metrics', () => {
    const invalidContext = {
      timestamp: new Date(),
      eventData: {},
      systemState: {},
      metrics: { metric1: 'not-a-number' },
    }

    const result = RuleContextSchema.safeParse(invalidContext)
    expect(result.success).toBe(false)
  })

  it('should reject missing required fields', () => {
    const incompleteContext = {
      timestamp: new Date(),
      eventData: {},
      // Missing systemState and metrics
    }

    const result = RuleContextSchema.safeParse(incompleteContext)
    expect(result.success).toBe(false)
  })
})

describe('RulePriority', () => {
  it('should have correct priority values', () => {
    expect(RulePriority.CRITICAL).toBe(0)
    expect(RulePriority.HIGH).toBe(1)
    expect(RulePriority.MEDIUM).toBe(2)
    expect(RulePriority.LOW).toBe(3)
  })

  it('should maintain priority order', () => {
    expect(RulePriority.CRITICAL < RulePriority.HIGH).toBe(true)
    expect(RulePriority.HIGH < RulePriority.MEDIUM).toBe(true)
    expect(RulePriority.MEDIUM < RulePriority.LOW).toBe(true)
  })
}) 