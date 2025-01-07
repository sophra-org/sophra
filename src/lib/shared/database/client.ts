import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../types';
import winston from 'winston';

export type JsonValue = Prisma.JsonValue;
export type JsonObject = Prisma.JsonObject;
export type ExperimentConfig = {
  feature: string;
  enabled: boolean;
};

export class EnhancedPrismaClient extends PrismaClient {
  private logger: Logger;
  private isConnected: boolean = false;
  private static instance: EnhancedPrismaClient;
  private activeConnections: number = 0;
  private readonly maxConnections: number = 10;
  private _customExperimentConfig?: ExperimentConfig;

  constructor() {
    super();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'prisma-client' },
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    }) as Logger;
    this.setupEventHandlers();
  }

  static getInstance(): EnhancedPrismaClient {
    if (!EnhancedPrismaClient.instance) {
      EnhancedPrismaClient.instance = new EnhancedPrismaClient();
    }
    return EnhancedPrismaClient.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.info('Database connection established', {
        activeConnections: this.activeConnections,
        maxConnections: this.maxConnections,
      });
    } catch (error) {
      this.logger.error(`Database connection failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error(`Database disconnect failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      return false;
    }
  }

  async getConnection(): Promise<this> {
    while (this.activeConnections >= this.maxConnections) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.activeConnections++;
    return this;
  }

  releaseConnection(): void {
    if (this.activeConnections > 0) {
      this.activeConnections--;
    }
  }

  get customExperimentConfig(): ExperimentConfig | undefined {
    return this._customExperimentConfig;
  }

  set customExperimentConfig(config: ExperimentConfig | undefined) {
    this._customExperimentConfig = config;
  }

  private setupEventHandlers() {
    if (process.env.NODE_ENV === "development") {
      this.$on('query' as never, (e: Prisma.QueryEvent) => {
        if (this.logger && typeof this.logger.debug === "function") {
          this.logger.debug("Prisma Query", {
            query: e.query,
            params: e.params,
            duration: e.duration,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }

    this.$on('error' as never, (e: Prisma.LogEvent) => {
      if (this.logger && typeof this.logger.error === "function") {
        this.logger.error("Prisma Error", {
          target: e.target,
          message: e.message,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }
}

export const prisma = EnhancedPrismaClient.getInstance();
