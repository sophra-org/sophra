import { Signal, SignalPattern, SignalType, Prisma } from "@prisma/client";

interface SignalMetadata {
  strength?: number;
  priority?: number;
  processing_time?: number;
  transformations?: string[];
  processor_id?: string;
  confidence?: number;
}

interface SignalData {
  [key: string]: unknown;
  features?: Record<string, unknown>;
}

export interface SignalProcessor {
  processor_id: string;
  process_signal(signal: Signal): Signal;
  process_batch(signals: Signal[]): Signal[];
  extract_features(signal: Signal): Record<string, unknown>;
  detect_patterns(signals: Signal[]): SignalPattern[];
  prioritize(signals: Signal[]): Signal[];
}

export interface ProcessorCriteria {
  signal_types: SignalType[];
  min_strength: number;
  max_strength: number;
  required_fields: string[];
  custom_filter?: (signal: Signal) => boolean;
}

export class SignalRouter {
  private _processors: Map<string, ProcessorCriteria> = new Map();

  route(signal: Signal): string[] {
    const matching_processors: string[] = [];

    for (const [processor_id, criteria] of this._processors.entries()) {
      if (this._matches_criteria(signal, criteria)) {
        matching_processors.push(processor_id);
      }
    }

    return matching_processors;
  }

  register_processor(processor_id: string, criteria: ProcessorCriteria): void {
    this._processors.set(processor_id, criteria);
  }

  unregister_processor(processor_id: string): void {
    this._processors.delete(processor_id);
  }

  private _matches_criteria(
    signal: Signal,
    criteria: ProcessorCriteria
  ): boolean {
    // Check signal type
    if (!criteria.signal_types.includes(signal.type)) {
      return false;
    }

    const metadata = signal.metadata as SignalMetadata;
    // Check strength bounds
    if (
      metadata?.strength !== undefined &&
      (metadata.strength < criteria.min_strength ||
       metadata.strength > criteria.max_strength)
    ) {
      return false;
    }

    // Check required fields in both value and metadata
    const value = signal.value as SignalData;
    const metadataObj = signal.metadata as Record<string, unknown>;
    for (const required_field of criteria.required_fields) {
      if (!(required_field in value) && !(required_field in metadataObj)) {
        return false;
      }
    }

    // Apply custom filter if present
    return !criteria.custom_filter || criteria.custom_filter(signal);
  }
}

export abstract class BaseSignalProcessor implements SignalProcessor {
  constructor(public processor_id: string) {}

  process_batch(signals: Signal[]): Signal[] {
    const processed_signals: Signal[] = [];
    const start_time = new Date();

    for (const signal of this.prioritize(signals)) {
      const features = this.extract_features(signal);
      const processed: Signal = {
        ...signal,
        id: `proc_${signal.id}`,
        value: {
          ...(signal.value as SignalData),
          features
        } as Prisma.JsonValue,
        source: this.processor_id,
        metadata: {
          ...(signal.metadata as SignalMetadata),
          processing_time: (new Date().getTime() - start_time.getTime()) / 1000,
          transformations: ["feature_extraction"],
          processor_id: this.processor_id,
          confidence: 1.0, // Should be overridden by implementations
        } as Prisma.JsonValue,
      };
      processed_signals.push(processed);
    }

    return processed_signals;
  }

  abstract extract_features(signal: Signal): Record<string, unknown>;
  abstract detect_patterns(signals: Signal[]): SignalPattern[];

  process_signal(signal: Signal): Signal {
    const features = this.extract_features(signal);
    return {
      ...signal,
      value: {
        ...(signal.value as SignalData),
        features
      } as Prisma.JsonValue
    };
  }

  prioritize(signals: Signal[]): Signal[] {
    return signals.sort((a, b) => {
      const bMetadata = b.metadata as SignalMetadata;
      const aMetadata = a.metadata as SignalMetadata;
      const bPriority = bMetadata?.priority ?? 0;
      const aPriority = aMetadata?.priority ?? 0;
      return Number(bPriority) - Number(aPriority);
    });
  }
}
