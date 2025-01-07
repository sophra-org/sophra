import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RedisClient } from './client'
import type { Logger } from '@/lib/shared/types'
import type { Redis } from 'ioredis'

// Mock Redis client
const mockRedis: jest.Mocked<Redis> = {
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  quit: vi.fn(),
  exists: vi.fn(),
  ping: vi.fn(),
} as unknown as jest.Mocked<Redis>

describe('RedisClient', () => {
  let redisClient: RedisClient
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
    redisClient = new RedisClient(mockRedis, mockLogger)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('setEx', () => {
    it('should set value with expiration', async () => {
      const key = 'test-key'
      const value = 'test-value'
      const ttl = 3600

      await redisClient.setEx(key, ttl, value)

      expect(mockRedis.setex).toHaveBeenCalledWith(key, ttl, value)
    })

    it('should use default TTL when not provided', async () => {
      const key = 'test-key'
      const value = 'test-value'
      const defaultTTL = 3600

      await redisClient.setEx(key, 0, value)

      expect(mockRedis.setex).toHaveBeenCalledWith(key, defaultTTL, value)
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.setex.mockRejectedValueOnce(error)

      await expect(
        redisClient.setEx('key', 3600, 'value')
      ).rejects.toThrow('Redis error')
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('getEx', () => {
    it('should get value', async () => {
      const key = 'test-key'
      const value = 'test-value'
      mockRedis.get.mockResolvedValueOnce(value)

      const result = await redisClient.getEx(key)

      expect(result).toBe(value)
      expect(mockRedis.get).toHaveBeenCalledWith(key)
    })

    it('should handle null values', async () => {
      mockRedis.get.mockResolvedValueOnce(null)

      const result = await redisClient.getEx('non-existent')

      expect(result).toBeNull()
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.get.mockRejectedValueOnce(error)

      await expect(
        redisClient.getEx('key')
      ).rejects.toThrow('Redis error')
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('del', () => {
    it('should delete key', async () => {
      const key = 'test-key'

      await redisClient.del(key)

      expect(mockRedis.del).toHaveBeenCalledWith(key)
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.del.mockRejectedValueOnce(error)

      await expect(
        redisClient.del('key')
      ).rejects.toThrow('Redis error')
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('exists', () => {
    it('should check if key exists', async () => {
      const key = 'test-key'
      mockRedis.exists.mockResolvedValueOnce(1)

      const result = await redisClient.exists(key)

      expect(result).toBe(true)
      expect(mockRedis.exists).toHaveBeenCalledWith(key)
    })

    it('should return false for non-existent keys', async () => {
      mockRedis.exists.mockResolvedValueOnce(0)

      const result = await redisClient.exists('non-existent')

      expect(result).toBe(false)
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.exists.mockRejectedValueOnce(error)

      await expect(
        redisClient.exists('key')
      ).rejects.toThrow('Redis error')
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('ping', () => {
    it('should check connection', async () => {
      mockRedis.ping.mockResolvedValueOnce('PONG')

      const result = await redisClient.ping()

      expect(result).toBe(true)
      expect(mockRedis.ping).toHaveBeenCalled()
    })

    it('should return false for failed ping', async () => {
      mockRedis.ping.mockResolvedValueOnce('ERROR')

      const result = await redisClient.ping()

      expect(result).toBe(false)
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.ping.mockRejectedValueOnce(error)

      const result = await redisClient.ping()

      expect(result).toBe(false)
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('should close connection', async () => {
      await redisClient.disconnect()

      expect(mockRedis.quit).toHaveBeenCalled()
    })

    it('should handle Redis errors', async () => {
      const error = new Error('Redis error')
      mockRedis.quit.mockRejectedValueOnce(error)

      await expect(
        redisClient.disconnect()
      ).rejects.toThrow('Redis error')
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('getClient', () => {
    it('should return Redis client', () => {
      const client = redisClient.getClient()

      expect(client).toBe(mockRedis)
    })
  })
})