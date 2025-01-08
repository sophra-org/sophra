import { EventEmitter } from "events";

export class ThreadPool extends EventEmitter {
  private size: number;
  private activeWorkers: number = 0;
  private queue: Array<{
    task: () => Promise<any>;
    taskId: string;
  }> = [];
  private isProcessing: boolean = false;

  constructor(size: number) {
    super();
    this.size = size;
    console.log(`ThreadPool initialized with ${size} workers`);
  }

  async runTasks<T>(
    tasks: Array<{ task: () => Promise<T>; id?: string }>
  ): Promise<void> {
    console.log(`Queueing ${tasks.length} tasks for processing...`);

    // Queue all tasks
    this.queue.push(
      ...tasks.map((t, i) => ({
        task: t.task,
        taskId: t.id || `task-${i}`,
      }))
    );

    // Start processing if not already running
    if (!this.isProcessing) {
      this.isProcessing = true;
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    while (this.queue.length > 0 && this.activeWorkers < this.size) {
      const batchSize = Math.min(
        this.size - this.activeWorkers,
        this.queue.length
      );

      const batch = this.queue.splice(0, batchSize);
      this.activeWorkers += batchSize;

      batch.forEach(async ({ task, taskId }) => {
        try {
          console.log(`Starting task ${taskId}`);
          const result = await task();
          this.emit("taskComplete", { taskId, result, error: null });
        } catch (error) {
          console.error(`Task ${taskId} failed:`, error);
          this.emit("taskError", { taskId, error });
        } finally {
          this.activeWorkers--;
          // Process next batch if there are more tasks
          if (this.queue.length > 0) {
            this.processBatch();
          } else if (this.activeWorkers === 0) {
            this.isProcessing = false;
            this.emit("allComplete");
          }
        }
      });
    }
  }
}
