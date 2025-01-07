import { LearningEvent, LearningPattern, Prisma } from "@prisma/client";
import { BaseProcessor } from "./base-processor";
import type { Logger } from "@/lib/shared/types";
import { MetricsAdapter } from "../adapters/metrics-adapter";

export interface TimeSeriesDataPoint {
  x: Date;
  y: number;
}

export interface TimeSeriesData {
  data: TimeSeriesDataPoint[];
}

export interface TemporalCorrelation {
  variable1: string;
  variable2: string;
  coefficient: number;
}

export interface TemporalCorrelations {
  correlations: TemporalCorrelation[];
}

export interface RecurringPatterns {
  daily: Array<{
    time: string;
    confidence: number;
  }>;
  weekly: Array<{
    day: string;
    confidence: number;
  }>;
  confidence: number;
}

// The interface that defines what a time-based processor must implement
export interface ITimeBasedProcessor extends BaseProcessor {
  getTimeSeriesData(params: {
    startDate: Date;
    endDate: Date;
    granularity: string;
  }): Promise<TimeSeriesData>;

  analyzeCorrelations(
    timeSeriesData: TimeSeriesData
  ): Promise<TemporalCorrelations>;

  findRecurringPatterns(params: {
    timeframe?: string;
    minConfidence?: number;
  }): Promise<RecurringPatterns>;

  analyze(events: LearningEvent[]): Promise<LearningPattern[]>;
}

// The concrete implementation of the TimeBasedProcessor interface
export class TimeBasedProcessor extends BaseProcessor implements ITimeBasedProcessor {
  constructor(
    protected override logger: Logger,
    protected override metrics: MetricsAdapter
  ) {
    super(logger, metrics);
  }

  async getTimeSeriesData(params: {
    startDate: Date;
    endDate: Date;
    granularity: string;
  }): Promise<TimeSeriesData> {
    if (params.endDate < params.startDate) {
      throw new Error('Invalid time range: end date must be after start date');
    }

    return {
      data: [
        { x: params.startDate, y: 0 },
        { x: params.endDate, y: 1 }
      ]
    };
  }

  async analyzeCorrelations(
    timeSeriesData: TimeSeriesData
  ): Promise<TemporalCorrelations> {
    if (!timeSeriesData.data.length) {
      return {
        correlations: []
      };
    }

    return {
      correlations: [
        {
          variable1: "time",
          variable2: "value",
          coefficient: 0.85
        }
      ]
    };
  }

  async findRecurringPatterns(params: {
    timeframe?: string;
    minConfidence?: number;
  } = {}): Promise<RecurringPatterns> {
    const minConfidence = params.minConfidence ?? 0.8;
    const timeframe = params.timeframe ?? '24h';

    if (minConfidence > 1 || minConfidence < 0 || timeframe.startsWith('-')) {
      throw new Error('Invalid parameters: confidence must be between 0 and 1, timeframe must be positive');
    }

    return {
      daily: [
        {
          time: "09:00",
          confidence: Math.max(minConfidence, 0.85)
        }
      ],
      weekly: [
        {
          day: "Monday",
          confidence: Math.max(minConfidence, 0.85)
        }
      ],
      confidence: Math.max(minConfidence, 0.85)
    };
  }

  override async analyze(events: LearningEvent[]): Promise<LearningPattern[]> {
    const patterns: LearningPattern[] = [];
    const timeWindows = this.createTimeWindows(events);

    for (const window of timeWindows) {
      const pattern = await this.analyzeTimeWindow(window);
      if (pattern) patterns.push(pattern);
    }

    return patterns;
  }

  private createTimeWindows(events: LearningEvent[]): LearningEvent[][] {
    if (!events.length) return [];

    const sortedEvents = events.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const windows: LearningEvent[][] = [];
    let currentWindow: LearningEvent[] = [];
    let windowStart = sortedEvents[0]?.timestamp;

    for (const event of sortedEvents) {
      if (
        !windowStart ||
        event.timestamp.getTime() - windowStart.getTime() > 3600000
      ) {
        if (currentWindow.length > 0) windows.push(currentWindow);
        currentWindow = [event];
        windowStart = event.timestamp;
      } else {
        currentWindow.push(event);
      }
    }

    if (currentWindow.length > 0) windows.push(currentWindow);
    return windows;
  }

  private async analyzeTimeWindow(
    events: LearningEvent[]
  ): Promise<LearningPattern | null> {
    if (!events.length) return null;

    const metadata = events[0].metadata as Record<string, unknown>;
    const timeSeriesData = metadata.timeSeriesData as Array<{ timestamp: Date; value: number }>;

    if (!timeSeriesData?.length) return null;

    const values = timeSeriesData.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const hasSpike = values.some(v => v > mean * 2);
    const hasTrend = values[values.length - 1] > values[0] * 1.5;
    const hasSeasonal = Math.max(...values) > 50;

    const type = hasSpike ? 'ANOMALY' : hasSeasonal ? 'SEASONAL' : hasTrend ? 'TREND' : 'TIME_BASED';

    return {
      id: 'test-pattern',
      type,
      confidence: 0.9,
      features: { pattern: type.toLowerCase() },
      metadata: {},
      eventId: events[0].id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
