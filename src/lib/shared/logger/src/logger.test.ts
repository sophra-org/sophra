import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from './logger'
import { LogLevel } from './logger'

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

describe('Logger', () => {
  let consoleSpy: { [key: string]: any }

  beforeEach(() => {
    // Set logger to default log level
    logger.level = LogLevel.INFO
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('log methods', () => {
    test('info() should log messages with INFO level', () => {
      const message = 'Test info message'
      logger.info(message)
      const expectedPath = '[src\\lib\\shared\\logger\\src\\logger]'
      expect(consoleSpy.info).toHaveBeenCalledWith(expectedPath, message)
    })

    test('error() should log messages with ERROR level', () => {
      const message = 'Test error message'
      logger.error(message)
      const expectedPath = '[src\\lib\\shared\\logger\\src\\logger]'
      expect(consoleSpy.error).toHaveBeenCalledWith(expectedPath, message)
    })

    test('warn() should log messages with WARN level', () => {
      const message = 'Test warning message'
      logger.warn(message)
      const expectedPath = '[src\\lib\\shared\\logger\\src\\logger]'
      expect(consoleSpy.warn).toHaveBeenCalledWith(expectedPath, message)
    })

    test('debug() should log messages with DEBUG level', () => {
      const message = 'Test debug message'
      logger.level = LogLevel.DEBUG
      logger.debug(message)
      const expectedPath = '[src\\lib\\shared\\logger\\src\\logger]'
      expect(consoleSpy.debug).toHaveBeenCalledWith(expectedPath, message)
    })

    test('should handle objects and errors', () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'test' }
      
      logger.error('Error occurred', { error, context })
      const expectedPath = '[src\\lib\\shared\\logger\\src\\logger]'
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expectedPath,
        'Error occurred',
        expect.objectContaining({
          error: expect.any(Error),
          context: expect.objectContaining(context)
        })
      )
    })
  })

  describe('error handling', () => {
    test('should handle invalid log levels gracefully', () => {
      const invalidLevel = 'INVALID_LEVEL'
      // @ts-ignore - Testing invalid input
      logger.level = invalidLevel
      
      const message = 'Test message'
      logger.info(message)
      expect(consoleSpy.info).toHaveBeenCalledWith('[src\\lib\\shared\\logger\\src\\logger]', message)
    })

    test('should handle undefined messages', () => {
      // @ts-ignore - Testing invalid input
      logger.info(undefined)
      expect(consoleSpy.info).toHaveBeenCalledWith('[src\\lib\\shared\\logger\\src\\logger]', undefined)
    })
  })

  describe('configuration', () => {
    test('should respect log level settings', () => {
      // Set to error level only
      logger.level = LogLevel.ERROR

      // Error should be logged
      logger.error('Test error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[src\\lib\\shared\\logger\\src\\logger]', 'Test error')

      // Info should not be logged
      logger.info('Test info')
      expect(consoleSpy.info).not.toHaveBeenCalled()
    })

    test('should handle invalid configuration gracefully', () => {
      // @ts-ignore - Testing invalid input
      logger.level = null
      
      const message = 'Test message'
      logger.info(message)
      expect(consoleSpy.info).toHaveBeenCalledWith('[src\\lib\\shared\\logger\\src\\logger]', message)
    })
  })
})