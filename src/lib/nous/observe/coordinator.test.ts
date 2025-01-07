import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignalCoordinator } from './coordinator'
import { Signal, SignalPattern, SignalType } from '@prisma/client'
import { ProcessorCriteria, SignalProcessor } from './signals'

const createTestSignal = (overrides: Partial<Signal> = {}): Signal => ({
  id: '1',
  type: SignalType.SEARCH,
  source: 'test',
  value: {},
  priority: 0,
  retries: 0,
  timestamp: new Date(),
  processed: false,
  processedAt: null,
  metadata: { query: 'test' },
  strength: 0.5,
  error: null,
  manual: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

class TestSignalProcessor implements SignalProcessor {
  public processor_id = 'test-processor'
  public processed_signals: Signal[] = []
  public detected_patterns: SignalPattern[] = []

  process_signal(signal: Signal): Signal {
    this.processed_signals.push(signal)
    return {
      ...signal,
      processed: true,
    }
  }

  process_batch(signals: Signal[]): Signal[] {
    return signals.map(signal => this.process_signal(signal))
  }

  extract_features(signal: Signal): Record<string, unknown> {
    return {}
  }

  detect_patterns(signals: Signal[]): SignalPattern[] {
    return this.detected_patterns
  }

  prioritize(signals: Signal[]): Signal[] {
    return signals
  }
}

describe('SignalCoordinator', () => {
  let coordinator: SignalCoordinator
  let testProcessor: TestSignalProcessor
  let testCriteria: ProcessorCriteria

  beforeEach(() => {
    coordinator = new SignalCoordinator()
    testProcessor = new TestSignalProcessor()
    testCriteria = {
      signal_types: [SignalType.SEARCH],
      min_strength: 0.1,
      max_strength: 1.0,
      required_fields: ['query'],
    }
    coordinator['processors'].set(testProcessor.processor_id, testProcessor)
    coordinator['router'].register_processor(testProcessor.processor_id, testCriteria)
  })

  describe('initialization', () => {
    it('should initialize with default processors', () => {
      expect(coordinator).toBeDefined()
    })
  })

  describe('processor registration', () => {
    it('should register custom processor', () => {
      const signal = createTestSignal()
      const processed = coordinator.process_signal(signal)
      expect(processed).toHaveLength(1)
      expect(processed[0]).toHaveProperty('processed', true)
    })

    it('should handle multiple processors', () => {
      class AnotherProcessor extends TestSignalProcessor {
        processor_id = 'another-processor'
      }
      const anotherProcessor = new AnotherProcessor()
      coordinator['processors'].set(anotherProcessor.processor_id, anotherProcessor)
      coordinator['router'].register_processor(anotherProcessor.processor_id, testCriteria)

      const signal = createTestSignal()
      const processed = coordinator.process_signal(signal)
      expect(processed).toHaveLength(2)
    })
  })

  describe('signal processing', () => {
    beforeEach(() => {
      coordinator.register_processor(TestSignalProcessor, testCriteria)
    })

    it('should process single signal', () => {
      const signal = createTestSignal()
      const processed = coordinator.process_signal(signal)
      expect(processed).toHaveLength(1)
      expect(processed[0]).toHaveProperty('processed', true)
    })

    it('should process batch of signals', () => {
      const signals = [
        createTestSignal({ id: '1', metadata: { query: 'test1' } }),
        createTestSignal({ id: '2', metadata: { query: 'test2' }, strength: 0.7 })
      ]

      const processed = coordinator.process_batch(signals)
      expect(processed).toHaveLength(2)
      processed.forEach(signal => {
        expect(signal).toHaveProperty('processed', true)
      })
    })

    it('should skip signals that do not match criteria', () => {
      const signal = createTestSignal({ type: SignalType.PERFORMANCE })
      const processed = coordinator.process_signal(signal)
      expect(processed).toHaveLength(0)
    })
  })

  describe('pattern detection', () => {
    beforeEach(() => {
      coordinator['processors'].set(testProcessor.processor_id, testProcessor);
      coordinator['router'].register_processor(testProcessor.processor_id, testCriteria);
    });

    it('should detect patterns from signals', () => {
      const testPattern: SignalPattern = {
        id: '1',
        patternId: 'test-pattern',
        signalIds: ['1'],
        confidence: 0.8,
        patternType: 'test',
        frequency: 1,
        impactScore: 1,
        relatedPatterns: [],
      };

      testProcessor.detected_patterns = [testPattern];
      const signal = createTestSignal();
      const patterns = coordinator.detect_patterns([signal]);
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toBe(testPattern);
    });

    it('should combine patterns from multiple processors', () => {
      class AnotherProcessor extends TestSignalProcessor {
        processor_id = 'another-processor';
        detect_patterns(): SignalPattern[] {
          return [{
            id: '2',
            patternId: 'another-pattern',
            signalIds: ['2'],
            confidence: 0.9,
            patternType: 'test',
            frequency: 1,
            impactScore: 1,
            relatedPatterns: [],
          }];
        }
      }

      const anotherProcessor = new AnotherProcessor();
      coordinator['processors'].set(anotherProcessor.processor_id, anotherProcessor);
      coordinator['router'].register_processor(anotherProcessor.processor_id, testCriteria);

      testProcessor.detected_patterns = [{
        id: '1',
        patternId: 'test-pattern',
        signalIds: ['1'],
        confidence: 0.8,
        patternType: 'test',
        frequency: 1,
        impactScore: 1,
        relatedPatterns: [],
      }];

      const signal = createTestSignal();
      const patterns = coordinator.detect_patterns([signal]);
      expect(patterns).toHaveLength(2);
      expect(patterns.map(p => p.patternId)).toContain('test-pattern');
      expect(patterns.map(p => p.patternId)).toContain('another-pattern');
    });
  });

  describe('error handling', () => {
    it('should handle processor errors gracefully', () => {
      class ErrorProcessor extends TestSignalProcessor {
        processor_id = 'error-processor';
        process_signal(): Signal {
          throw new Error('Processing error');
        }
      }

      const errorProcessor = new ErrorProcessor();
      coordinator['processors'].set(errorProcessor.processor_id, errorProcessor);
      coordinator['router'].register_processor(errorProcessor.processor_id, testCriteria);

      // Register the working processor as well
      coordinator['processors'].set(testProcessor.processor_id, testProcessor);
      coordinator['router'].register_processor(testProcessor.processor_id, testCriteria);

      const signal = createTestSignal();
      expect(() => coordinator.process_signal(signal)).not.toThrow();
      const processed = coordinator.process_signal(signal);
      expect(processed).toHaveLength(1); // Only the working processor should return a result
      expect(processed[0]).toHaveProperty('processed', true);
    });
  });
}) 