import * as fs from 'fs';
import { parse as yamlParse } from 'yaml';
import { Config, ConfigSchema, Environment } from './types';

export class Settings {
  private static instance: Settings;
  private config: Config | null = null;
  private readonly envPrefix = "NOUS_";

  private constructor() {}

  static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }

  public load(configPath?: string): void {
    // Start with default config
    let config = this.getDefaultConfig();

    // Load from file if provided
    if (configPath && fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const fileConfig = yamlParse(fileContent) || {};
        config = this.deepMerge(config, fileConfig);
      } catch (error) {
        console.error(`Error loading config file: ${error}`);
      }
    }

    // Load from environment variables
    const envConfig = this.loadFromEnv();
    config = this.deepMerge(config, envConfig);

    // Validate the final configuration
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.errors.map(e => e.message).join(', ')}`);
    }

    this.config = result.data;
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== 'object') {
      return target;
    }

    const output = { ...target };
    
    Object.keys(source).forEach(key => {
      const value = source[key];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          output[key] = this.deepMerge(target[key], value);
        } else {
          output[key] = { ...value };
        }
      } else if (value !== undefined) {
        output[key] = value;
      }
    });

    return output;
  }

  private loadFromEnv(): Partial<Config> {
    const config: Partial<Config> = {};

    Object.keys(process.env)
      .filter(key => key.startsWith(this.envPrefix))
      .forEach(key => {
        const path = key
          .slice(this.envPrefix.length)
          .toLowerCase()
          .split('_');
        
        let current = config;
        for (let i = 0; i < path.length - 1; i++) {
          const segment = this.normalizeKey(path[i]);
          current[segment] = current[segment] || {};
          current = current[segment];
        }

        const lastSegment = this.normalizeKey(path[path.length - 1]);
        const value = process.env[key];
        if (value !== undefined) {
          current[lastSegment] = this.convertValue(value);
        }
      });

    return config;
  }

  private convertValue(value: string): any {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private normalizeKey(key: string): string {
    const specialCases: { [key: string]: string } = {
      'corsorigins': 'corsOrigins',
      'corsallowmethods': 'corsAllowMethods',
      'corsallowheaders': 'corsAllowHeaders',
      'corsallowcredentials': 'corsAllowCredentials',
      'storagepath': 'storagePath',
      'maxversionsperentry': 'maxVersionsPerEntry',
      'enableversionpruning': 'enableVersionPruning',
      'metadatavalidation': 'metadataValidation',
      'eventbuffersize': 'eventBufferSize',
      'batchsize': 'batchSize',
      'processingintervalms': 'processingIntervalMs',
      'modelcachesize': 'modelCacheSize',
      'trainingbatchsize': 'trainingBatchSize',
      'evaluationinterval': 'evaluationInterval',
      'minsamplesrequired': 'minSamplesRequired',
      'loglevel': 'logLevel'
    };

    const normalized = key.toLowerCase();
    return specialCases[normalized] || normalized;
  }

  private getDefaultConfig(): Config {
    return {
      environment: Environment.DEVELOPMENT,
      server: {
        port: 3000,
        host: '0.0.0.0',
        corsOrigins: ['*'],
        corsAllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        corsAllowHeaders: ['Content-Type', 'Authorization'],
        corsAllowCredentials: true,
      },
      registry: {
        storagePath: './data/registry',
        maxVersionsPerEntry: 5,
        enableVersionPruning: true,
        metadataValidation: true,
      },
      observe: {
        eventBufferSize: 1000,
        batchSize: 100,
        processingIntervalMs: 1000,
      },
      learn: {
        modelCacheSize: 5,
        trainingBatchSize: 32,
        evaluationInterval: 1000,
        minSamplesRequired: 100,
      },
      debug: false,
      logLevel: 'INFO',
      additionalSettings: {},
    };
  }

  public getConfig(): Config {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }

  public isProd(): boolean {
    const config = this.getConfig();
    return config.environment === Environment.PRODUCTION;
  }

  public isDev(): boolean {
    const config = this.getConfig();
    return config.environment === Environment.DEVELOPMENT;
  }

  public isStaging(): boolean {
    const config = this.getConfig();
    return config.environment === Environment.STAGING;
  }
}

export const settings = Settings.getInstance();
