export type Task<T> = () => Promise<T>;

interface QueuedTask<T> {
  task: Task<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export class ThreadPool {
  private workers: number;
  private running: boolean;
  private queue: Array<QueuedTask<unknown>>;
  private activeWorkers: number;

  constructor(workers: number) {
    this.workers = workers;
    this.running = true;
    this.queue = [];
    this.activeWorkers = 0;
  }

  async execute<T>(task: Task<T>): Promise<T> {
    if (!this.running) {
      return task();
    }

    if (this.activeWorkers < this.workers) {
      this.activeWorkers++;
      try {
        const result = await task();
        return result;
      } finally {
        this.activeWorkers--;
        this.processQueue();
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as Task<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.activeWorkers >= this.workers) {
      return;
    }

    const nextTask = this.queue.shift();
    if (nextTask) {
      this.activeWorkers++;
      try {
        const result = await nextTask.task();
        nextTask.resolve(result);
      } catch (error) {
        nextTask.reject(error);
      } finally {
        this.activeWorkers--;
        this.processQueue();
      }
    }
  }

  shutdown(): void {
    this.running = false;
    this.queue = [];
    this.activeWorkers = 0;
  }
}
