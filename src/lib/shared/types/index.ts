import { Logger as WinstonLogger } from 'winston';

export interface Logger extends WinstonLogger {
  service: string;
}

export interface ServiceConfig {
  redis?: {
    url: string;
    password?: string;
  };
}

export const NousAdaptationType = Object.freeze({
  BOOST: 'boost',
  FILTER: 'filter',
  REWRITE: 'rewrite'
} as const);

export type NousAdaptationType = typeof NousAdaptationType[keyof typeof NousAdaptationType];
