import { Signal, SignalPattern, SignalType } from "@prisma/client";
import { SearchSignalProcessor } from "./processors";
import { ProcessorCriteria, SignalProcessor, SignalRouter } from "./signals";
import logger from "@/lib/shared/logger";

export class SignalCoordinator {
  private router: SignalRouter = new SignalRouter();
  private processors: Map<string, SignalProcessor> = new Map();

  constructor() {
    this._register_default_processors();
  }

  process_signal(signal: Signal): Signal[] {
    try {
      if (!signal || !signal.type || !Object.values(SignalType).includes(signal.type)) {
        throw new Error('Invalid signal: missing or invalid type');
      }

      const processed_signals: Signal[] = [];
      const processor_ids = this.router.route(signal);

      for (const processor_id of processor_ids) {
        const processor = this.processors.get(processor_id);
        if (processor) {
          try {
            const processed = processor.process_signal(signal);
            if (processed) {
              processed_signals.push(processed);
            }
          } catch (error) {
            logger.error('Error processing signal', { error, processor_id, signal });
          }
        }
      }

      return processed_signals;
    } catch (error) {
      logger.error('Error in process_signal', { error, signal });
      return [];
    }
  }

  process_batch(signals: Signal[]): Signal[] {
    try {
      if (!Array.isArray(signals)) {
        throw new Error('Invalid signals: must be an array');
      }

      const all_processed: Signal[] = [];
      for (const signal of signals) {
        const processed = this.process_signal(signal);
        all_processed.push(...processed);
      }
      return all_processed;
    } catch (error) {
      logger.error('Error in process_batch', { error });
      return [];
    }
  }

  detect_patterns(signals: Signal[]): SignalPattern[] {
    try {
      const all_patterns: SignalPattern[] = [];
      
      for (const processor of this.processors.values()) {
        try {
          const patterns = processor.detect_patterns(signals);
          if (patterns && Array.isArray(patterns)) {
            all_patterns.push(...patterns);
          }
        } catch (error) {
          logger.error('Error detecting patterns in processor', { error, processor_id: processor.processor_id });
        }
      }
      
      return all_patterns;
    } catch (error) {
      logger.error('Error in detect_patterns', { error });
      return [];
    }
  }

  register_processor(
    processor_class: new () => SignalProcessor,
    criteria: ProcessorCriteria
  ): void {
    try {
      if (!processor_class || typeof processor_class !== 'function') {
        throw new Error('Invalid processor class');
      }

      if (!criteria || !criteria.signal_types || !Array.isArray(criteria.signal_types)) {
        throw new Error('Invalid processor criteria');
      }

      const processor = new processor_class();
      if (!processor.processor_id) {
        throw new Error('Invalid processor: missing processor_id');
      }

      this.processors.set(processor.processor_id, processor);
      this.router.register_processor(processor.processor_id, criteria);
    } catch (error) {
      logger.error('Error registering processor', { error, criteria });
      throw error;
    }
  }

  private _register_default_processors(): void {
    try {
      const search_criteria: ProcessorCriteria = {
        signal_types: [SignalType.SEARCH],
        min_strength: 0.1,
        max_strength: 1.0,
        required_fields: ["query", "results"],
      };

      const ProcessorClass = SearchSignalProcessor as unknown as new () => SignalProcessor;
      this.register_processor(ProcessorClass, search_criteria);

    } catch (error) {
      logger.error('Error registering default processors', { error });
    }
  }
}
