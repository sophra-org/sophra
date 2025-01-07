import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ServiceManager } from './service-manager'
import { EventCollector } from '@/lib/nous/observe/collector'
import { SignalCoordinator } from '@/lib/nous/observe/coordinator'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

// Mock dependencies
vi.mock('@/lib/shared/database/client', () => ({
  default: {
    $disconnect: vi.fn(),
    $connect: vi.fn(),
    $on: vi.fn(),
    $use: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  } as unknown as PrismaClient,
}))

vi.mock('ioredis', () => {
  const mockRedis = {
    quit: vi.fn(),
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  }
  return {
    default: vi.fn().mockImplementation(() => mockRedis),
  }
})

describe('ServiceManager', () => {
  let manager: ServiceManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = ServiceManager.getInstance({ 
      environment: 'test',
      redis: { url: 'redis://localhost:6379' }
    })
  })

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = ServiceManager.getInstance()
      const instance2 = ServiceManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should throw if not initialized with config', () => {
      // Reset singleton for this test
      // @ts-ignore - Accessing private static for testing
      ServiceManager.instance = undefined
      expect(() => ServiceManager.getInstance()).toThrow('ServiceManager not initialized')
    })
  })

  describe('service access', () => {
    it('should get signal coordinator', () => {
      const coordinator = manager.getSignalCoordinator()
      expect(coordinator).toBeInstanceOf(SignalCoordinator)
    })

    it('should get event collector', () => {
      const collector = manager.getEventCollector()
      expect(collector).toBeInstanceOf(EventCollector)
    })

    it('should get prisma client', () => {
      const prisma = manager.getPrisma()
      expect(prisma).toBeDefined()
      expect(typeof prisma.$disconnect).toBe('function')
      expect(typeof prisma.$connect).toBe('function')
    })

    it('should get redis client', () => {
      const redis = manager.getRedis()
      expect(redis).toBeDefined()
      if (redis) {
        expect(typeof redis.quit).toBe('function')
        expect(typeof redis.connect).toBe('function')
      }
    })
  })

  describe('shutdown', () => {
    it('should disconnect all services', async () => {
      await manager.shutdown()
      
      const redis = manager.getRedis()
      if (redis) {
        expect(redis.quit).toHaveBeenCalled()
      }
      
      const prisma = manager.getPrisma()
      expect(prisma.$disconnect).toHaveBeenCalled()
    })
  })
}) 