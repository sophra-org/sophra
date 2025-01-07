import { z } from "zod";

export enum Environment {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
}

export const ServerConfigSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.number().default(3000),
  corsOrigins: z.array(z.string()).default(['*']),
  corsAllowMethods: z.array(z.string()).default(['*']),
  corsAllowHeaders: z.array(z.string()).default(['*']),
  corsAllowCredentials: z.boolean().default(true)
}).strict();

export const RegistryConfigSchema = z.object({
  storagePath: z.string(),
  maxVersionsPerEntry: z.number().default(10),
  enableVersionPruning: z.boolean().default(true),
  metadataValidation: z.boolean().default(true)
}).strict();

export const ObserveConfigSchema = z.object({
  eventBufferSize: z.number().default(1000),
  batchSize: z.number().default(100),
  processingIntervalMs: z.number().default(500)
}).strict();

export const LearnConfigSchema = z.object({
  modelCacheSize: z.number().default(5),
  trainingBatchSize: z.number().default(32),
  evaluationInterval: z.number().default(1000),
  minSamplesRequired: z.number().default(100)
}).strict();

export const ConfigSchema = z.object({
  environment: z.nativeEnum(Environment),
  server: ServerConfigSchema.default({}),
  registry: RegistryConfigSchema.default({
    storagePath: './storage'
  }),
  observe: ObserveConfigSchema.default({}),
  learn: LearnConfigSchema.default({}),
  debug: z.boolean().default(false),
  logLevel: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]).default("INFO"),
  additionalSettings: z.record(z.unknown()).default({})
}).strict();

export type Config = z.infer<typeof ConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type RegistryConfig = z.infer<typeof RegistryConfigSchema>;
export type ObserveConfig = z.infer<typeof ObserveConfigSchema>;
export type LearnConfig = z.infer<typeof LearnConfigSchema>;
