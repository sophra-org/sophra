export * from './base-processor';
export * from './feedback-processor';
export * from './performance-processor';
export * from './strategy-processor';
export { TimeBasedProcessor } from './time-based-processor';
export type { 
  ITimeBasedProcessor,
  TimeSeriesData,
  TimeSeriesDataPoint,
  TemporalCorrelation,
  TemporalCorrelations,
  RecurringPatterns
} from './time-based-processor';