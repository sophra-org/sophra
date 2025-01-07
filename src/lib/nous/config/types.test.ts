import { describe, it, expect } from 'vitest'
import {
  ServerConfigSchema,
  RegistryConfigSchema,
  ObserveConfigSchema,
  LearnConfigSchema,
  ConfigSchema,
  Environment,
} from './types'

describe('ServerConfigSchema', () => {
  it('should validate valid server config', () => {
    const validConfig = {
      host: 'localhost',
      port: 8080,
      corsOrigins: ['http://localhost:3000'],
      corsAllowCredentials: true,
      corsAllowMethods: ['GET', 'POST'],
      corsAllowHeaders: ['Content-Type'],
    }

    const result = ServerConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should apply default values', () => {
    const minimalConfig = {}
    const result = ServerConfigSchema.safeParse(minimalConfig)
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        host: '0.0.0.0',
        port: 3000,
        corsOrigins: ['*'],
        corsAllowCredentials: true,
        corsAllowMethods: ['*'],
        corsAllowHeaders: ['*'],
      })
    }
  })

  it('should reject invalid port', () => {
    const invalidConfig = {
      port: 'not-a-number',
    }

    const result = ServerConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })
})

describe('RegistryConfigSchema', () => {
  it('should validate valid registry config', () => {
    const validConfig = {
      storagePath: './data',
      maxVersionsPerEntry: 5,
      enableVersionPruning: true,
      metadataValidation: true,
    }

    const result = RegistryConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should require storagePath', () => {
    const invalidConfig = {
      maxVersionsPerEntry: 5,
    }

    const result = RegistryConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })

  it('should apply default values', () => {
    const minimalConfig = {
      storagePath: './data',
    }

    const result = RegistryConfigSchema.safeParse(minimalConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        storagePath: './data',
        maxVersionsPerEntry: 10,
        enableVersionPruning: true,
        metadataValidation: true,
      })
    }
  })

  it('should reject invalid maxVersionsPerEntry', () => {
    const invalidConfig = {
      storagePath: './data',
      maxVersionsPerEntry: 'not-a-number',
    }

    const result = RegistryConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })

  it('should validate required fields', () => {
    const invalidConfig = {
      maxVersionsPerEntry: 'not-a-number',
      enableVersionPruning: true,
      metadataValidation: true,
    }

    const result = RegistryConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })
})

describe('ObserveConfigSchema', () => {
  it('should validate valid observe config', () => {
    const validConfig = {
      eventBufferSize: 500,
      batchSize: 50,
      processingIntervalMs: 1000,
    }

    const result = ObserveConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should apply default values', () => {
    const minimalConfig = {}
    const result = ObserveConfigSchema.safeParse(minimalConfig)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        eventBufferSize: 1000,
        batchSize: 100,
        processingIntervalMs: 500,
      })
    }
  })
})

describe('LearnConfigSchema', () => {
  it('should validate valid learn config', () => {
    const validConfig = {
      modelCacheSize: 10,
      trainingBatchSize: 64,
      evaluationInterval: 2000,
      minSamplesRequired: 200,
    }

    const result = LearnConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should apply default values', () => {
    const minimalConfig = {}
    const result = LearnConfigSchema.safeParse(minimalConfig)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        modelCacheSize: 5,
        trainingBatchSize: 32,
        evaluationInterval: 1000,
        minSamplesRequired: 100,
      })
    }
  })
})

describe('ConfigSchema', () => {
  it('should validate complete valid config', () => {
    const validConfig = {
      environment: Environment.DEVELOPMENT,
      server: {
        host: 'localhost',
        port: 8080,
        corsOrigins: ['http://localhost:3000'],
        corsAllowMethods: ['GET', 'POST'],
        corsAllowHeaders: ['Content-Type'],
        corsAllowCredentials: true,
      },
      registry: {
        storagePath: './data',
        maxVersionsPerEntry: 5,
        enableVersionPruning: true,
        metadataValidation: true,
      },
      observe: {
        eventBufferSize: 500,
        batchSize: 100,
        processingIntervalMs: 500,
      },
      learn: {
        modelCacheSize: 10,
        trainingBatchSize: 32,
        evaluationInterval: 1000,
        minSamplesRequired: 100,
      },
      debug: true,
      logLevel: 'DEBUG',
      additionalSettings: {
        customKey: 'value',
      },
    }

    const result = ConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should require environment', () => {
    const invalidConfig = {
      server: {},
      registry: { storagePath: './data' },
    }

    const result = ConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })

  it('should validate environment enum values', () => {
    const validEnvironments = [Environment.DEVELOPMENT, Environment.STAGING, Environment.PRODUCTION]
    const invalidEnvironment = 'invalid'

    validEnvironments.forEach(env => {
      const result = ConfigSchema.safeParse({
        environment: env,
        registry: { storagePath: './data' },
      })
      expect(result.success).toBe(true)
    })

    const result = ConfigSchema.safeParse({
      environment: invalidEnvironment,
      registry: { storagePath: './data' },
    })
    expect(result.success).toBe(false)
  })

  it('should apply default values', () => {
    const minimalConfig = {
      environment: Environment.DEVELOPMENT,
      registry: { storagePath: './data' },
    }

    const result = ConfigSchema.safeParse(minimalConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.debug).toBe(false)
      expect(result.data.logLevel).toBe('INFO')
      expect(result.data.additionalSettings).toEqual({})
    }
  })
}) 