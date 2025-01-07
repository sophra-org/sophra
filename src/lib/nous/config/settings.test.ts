import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as yaml from 'yaml'
import { Settings } from './settings'
import { Environment } from './types'

// Mock modules
vi.mock('fs', async () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

vi.mock('yaml', async () => ({
  parse: vi.fn(),
}))

describe('Settings', () => {
  let settings: Settings

  beforeEach(() => {
    vi.resetModules()
    settings = Settings.getInstance()
    // Reset environment variables
    Object.keys(process.env)
      .filter(key => key.startsWith('NOUS_'))
      .forEach(key => delete process.env[key])
    // Reset config
    settings['config'] = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = Settings.getInstance()
      const instance2 = Settings.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should initialize with default config', () => {
      // Mock yaml.parse to return empty object for default config
      vi.mocked(yaml.parse).mockReturnValue({})
      
      settings.load()
      const config = settings.getConfig()
      
      expect(config.environment).toBe(Environment.DEVELOPMENT)
      expect(config.server.port).toBe(3000)
      expect(config.server.host).toBe('0.0.0.0')
    })
  })

  describe('configuration loading', () => {
    it('should load config from file', () => {
      const mockFileConfig = {
        environment: Environment.STAGING,
        server: {
          port: 4000,
        },
        registry: {
          storagePath: './custom/path',
        }
      }

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue('mock-yaml-content')
      vi.mocked(yaml.parse).mockReturnValue(mockFileConfig)

      settings.load('config.yml')
      const config = settings.getConfig()

      expect(config.server.port).toBe(4000)
      expect(config.registry.storagePath).toBe('./custom/path')
      expect(fs.readFileSync).toHaveBeenCalledWith('config.yml', 'utf-8')
    })

    it('should handle file loading errors', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File read error')
      })
      vi.mocked(yaml.parse).mockReturnValue({})

      expect(() => settings.load('invalid.yml')).not.toThrow()
    })

    it('should load config from environment variables', () => {
      process.env.NOUS_SERVER_PORT = '4000'
      process.env.NOUS_SERVER_HOST = '127.0.0.1'
      process.env.NOUS_REGISTRY_STORAGEPATH = './env/path'

      vi.mocked(yaml.parse).mockReturnValue({})
      settings.load()
      const config = settings.getConfig()

      expect(config.server.port).toBe(4000)
      expect(config.server.host).toBe('127.0.0.1')
      expect(config.registry.storagePath).toBe('./env/path')
    })

    it('should handle environment variable type conversion', () => {
      process.env.NOUS_OBSERVE_EVENTBUFFERSIZE = '2000'
      process.env.NOUS_REGISTRY_ENABLEVERSIONPRUNING = 'false'
      process.env.NOUS_REGISTRY_STORAGEPATH = './data'

      vi.mocked(yaml.parse).mockReturnValue({})
      settings.load()
      const config = settings.getConfig()

      expect(config.observe.eventBufferSize).toBe(2000)
      expect(config.registry.enableVersionPruning).toBe(false)
    })

    it('should respect configuration priority (env > file > default)', () => {
      const mockFileConfig = {
        server: {
          port: 4000,
          corsOrigins: ['http://localhost:3000'],
        },
        registry: {
          storagePath: './file/path',
        }
      }

      process.env.NOUS_SERVER_PORT = '5000'
      process.env.NOUS_REGISTRY_STORAGEPATH = './env/path'

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue('mock-yaml-content')
      vi.mocked(yaml.parse).mockReturnValue(mockFileConfig)

      settings.load('config.yml')
      const config = settings.getConfig()

      expect(config.server.port).toBe(5000) // From env
      expect(config.server.corsOrigins).toEqual(['http://localhost:3000']) // From file
      expect(config.server.host).toBe('0.0.0.0') // From default
      expect(config.registry.storagePath).toBe('./env/path') // From env
    })
  })

  describe('config validation', () => {
    beforeEach(() => {
      // Reset the config before each test
      settings['config'] = null
      // Mock the default config to be minimal
      vi.spyOn(settings as any, 'getDefaultConfig').mockReturnValue({})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should throw on invalid configuration', () => {
      const invalidConfig = {
        environment: 'invalid-env',
        server: {
          port: 'not-a-number',
          corsOrigins: 123, // Should be an array
        },
        registry: {
          storagePath: 123, // Should be a string
        },
        invalidKey: 'should not be here'
      }

      vi.mocked(yaml.parse).mockReturnValue(invalidConfig)
      expect(() => settings.load()).toThrow()
    })

    it('should throw when accessing unloaded configuration', () => {
      settings['config'] = null
      expect(() => settings.getConfig()).toThrow('Configuration not loaded')
    })
  })

  describe('environment helpers', () => {
    beforeEach(() => {
      settings['config'] = null
    })

    it('should correctly identify environments', () => {
      // Just use the default config which is DEVELOPMENT
      settings.load()
      expect(settings.isDev()).toBe(true)
      expect(settings.isProd()).toBe(false)
      expect(settings.isStaging()).toBe(false)
    })
  })
})