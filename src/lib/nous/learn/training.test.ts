import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TrainingScheduler } from './training'
import { Event, EventType } from '@/lib/nous/types'
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

describe('TrainingScheduler', () => {
  let scheduler: TrainingScheduler

  beforeEach(() => {
    vi.clearAllMocks()
    scheduler = new TrainingScheduler({
      minEvents: 10, // Lower threshold for testing
      trainingIntervalDays: 7,
      maxCostPerTraining: 50.0,
    })
  })

  describe('shouldTrain', () => {
    it('should return false when not enough events', () => {
      const events: Event[] = Array(5).fill({
        type: EventType.SEARCH,
        timestamp: new Date(),
      })

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Not enough events for training')
      )
    })

    it('should return false when training interval not reached', () => {
      // @ts-ignore - Accessing private property for testing
      scheduler.lastTraining = new Date()

      const events: Event[] = Array(20).fill({
        type: EventType.SEARCH,
        timestamp: new Date(),
      })

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith('Training interval not reached')
    })

    it('should return false when event distribution is insufficient', () => {
      const events: Event[] = Array(20).fill({
        type: EventType.SEARCH,
        timestamp: new Date(),
      })

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith(
        'Insufficient event type distribution for training'
      )
    })

    it('should return true when all conditions are met', () => {
      const events: Event[] = [
        ...Array(8).fill({
          type: EventType.SEARCH,
          timestamp: new Date(),
        }),
        ...Array(2).fill({
          type: EventType.USER,
          timestamp: new Date(),
        }),
      ]

      // Set last training to more than interval days ago
      // @ts-ignore - Accessing private property for testing
      scheduler.lastTraining = new Date(
        Date.now() - 8 * 24 * 60 * 60 * 1000
      )

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(true)
    })
  })

  describe('event distribution analysis', () => {
    it('should require minimum search events', () => {
      const events: Event[] = [
        ...Array(5).fill({
          type: EventType.USER,
          timestamp: new Date(),
        }),
        ...Array(5).fill({
          type: EventType.SYSTEM,
          timestamp: new Date(),
        }),
      ]

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith(
        'Insufficient event type distribution for training'
      )
    })

    it('should require minimum user events', () => {
      const events: Event[] = [
        ...Array(10).fill({
          type: EventType.SEARCH,
          timestamp: new Date(),
        }),
      ]

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith(
        'Insufficient event type distribution for training'
      )
    })
  })

  describe('training interval', () => {
    it('should respect minimum interval between trainings', () => {
      const events: Event[] = [
        ...Array(8).fill({
          type: EventType.SEARCH,
          timestamp: new Date(),
        }),
        ...Array(2).fill({
          type: EventType.USER,
          timestamp: new Date(),
        }),
      ]

      // Set last training to less than interval days ago
      // @ts-ignore - Accessing private property for testing
      scheduler.lastTraining = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      )

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(false)
      expect(logger.info).toHaveBeenCalledWith('Training interval not reached')
    })

    it('should allow training after interval has passed', () => {
      const events: Event[] = [
        ...Array(8).fill({
          type: EventType.SEARCH,
          timestamp: new Date(),
        }),
        ...Array(2).fill({
          type: EventType.USER,
          timestamp: new Date(),
        }),
      ]

      // Set last training to more than interval days ago
      // @ts-ignore - Accessing private property for testing
      scheduler.lastTraining = new Date(
        Date.now() - 8 * 24 * 60 * 60 * 1000
      )

      const shouldTrain = scheduler.shouldTrain(events)

      expect(shouldTrain).toBe(true)
    })
  })
}) 