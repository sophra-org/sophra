export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private stats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    lastFailure: null as Date | null,
    lastSuccess: null as Date | null,
  };

  constructor(
    private config: {
      failureThreshold: number;
      resetTimeout: number;
      name: string;
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.stats.totalCalls++;

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`${this.config.name} circuit breaker is open`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.stats.successfulCalls++;
    this.stats.lastSuccess = new Date();
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.stats.failedCalls++;
    this.stats.lastFailure = new Date();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
      name: this.config.name,
      config: {
        failureThreshold: this.config.failureThreshold,
        resetTimeout: this.config.resetTimeout,
      },
      stats: this.stats,
    };
  }

  isAvailable(): boolean {
    return this.state !== 'OPEN';
  }
} 