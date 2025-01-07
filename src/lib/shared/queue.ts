export class OperationQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private stats = {
    processed: 0,
    failed: 0,
    queued: 0,
  };

  constructor(
    private config: {
      maxConcurrent: number;
      maxQueueSize: number;
      timeout: number;
      name: string;
    }
  ) {}

  async add<T>(operation: () => Promise<T>): Promise<T> {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`${this.config.name} queue is full`);
    }

    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${this.config.name} operation timed out`));
      }, this.config.timeout);
    });

    const operationWithTimeout = async (): Promise<T> => {
      try {
        const result = await Promise.race([operation(), timeoutPromise]);
        this.stats.processed++;
        return result;
      } catch (error) {
        this.stats.failed++;
        throw error;
      } finally {
        this.running--;
        this.processQueue();
      }
    };

    if (this.running < this.config.maxConcurrent) {
      this.running++;
      return operationWithTimeout();
    }

    this.stats.queued++;
    return new Promise<T>((resolve, reject) => {
      this.queue.push(() => {
        return operationWithTimeout().then(resolve).catch(reject);
      });
    });
  }

  private processQueue() {
    if (this.queue.length > 0 && this.running < this.config.maxConcurrent) {
      const next = this.queue.shift();
      if (next) {
        this.running++;
        next();
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      running: this.running,
      queued: this.queue.length,
      name: this.config.name,
      config: {
        maxConcurrent: this.config.maxConcurrent,
        maxQueueSize: this.config.maxQueueSize,
        timeout: this.config.timeout,
      },
    };
  }
} 