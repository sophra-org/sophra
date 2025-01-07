import type { Logger } from "@/lib/shared/types";

export interface BaseServiceConfig {
  logger: Logger;
  environment: "development" | "production" | "test";
}

export abstract class BaseService {
  protected readonly logger: Logger;
  protected readonly environment: string;

  constructor(config: BaseServiceConfig) {
    this.logger = config.logger;
    this.environment = config.environment;
  }

  abstract healthCheck(): Promise<boolean>;
  abstract disconnect?(): Promise<void>;
}
