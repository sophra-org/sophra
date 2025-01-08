"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadPool = void 0;
const events_1 = require("events");
class ThreadPool extends events_1.EventEmitter {
    constructor(size) {
        super();
        this.activeWorkers = 0;
        this.queue = [];
        this.isProcessing = false;
        this.size = size;
        console.log(`ThreadPool initialized with ${size} workers`);
    }
    async runTasks(tasks) {
        console.log(`Queueing ${tasks.length} tasks for processing...`);
        // Queue all tasks
        this.queue.push(...tasks.map((t, i) => ({
            task: t.task,
            taskId: t.id || `task-${i}`,
        })));
        // Start processing if not already running
        if (!this.isProcessing) {
            this.isProcessing = true;
            await this.processBatch();
        }
    }
    async processBatch() {
        while (this.queue.length > 0 && this.activeWorkers < this.size) {
            const batchSize = Math.min(this.size - this.activeWorkers, this.queue.length);
            const batch = this.queue.splice(0, batchSize);
            this.activeWorkers += batchSize;
            batch.forEach(async ({ task, taskId }) => {
                try {
                    console.log(`Starting task ${taskId}`);
                    const result = await task();
                    this.emit("taskComplete", { taskId, result, error: null });
                }
                catch (error) {
                    console.error(`Task ${taskId} failed:`, error);
                    this.emit("taskError", { taskId, error });
                }
                finally {
                    this.activeWorkers--;
                    // Process next batch if there are more tasks
                    if (this.queue.length > 0) {
                        this.processBatch();
                    }
                    else if (this.activeWorkers === 0) {
                        this.isProcessing = false;
                        this.emit("allComplete");
                    }
                }
            });
        }
    }
}
exports.ThreadPool = ThreadPool;
