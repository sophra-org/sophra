/**
 * 🎪 Request Queue: Your Traffic Controller!
 *
 * Manages multiple requests to keep everything orderly.
 * Like having a friendly crossing guard for your data! 🚦
 *
 * Features:
 * - 🎯 Concurrent request limiting
 * - 🔄 Automatic queue processing
 * - ⏳ Request scheduling
 * - 🛡️ Error handling
 *
 * @class RequestQueue
 */
export class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private processing = false;
  private concurrentLimit: number;
  private activeRequests = 0;

  /**
   * 🎬 Create New Queue
   *
   * Sets up a new traffic system for requests.
   * Like setting up a new crossing guard post! 🚸
   *
   * @param {number} [concurrentLimit=5] - How many can cross at once
   */
  constructor(concurrentLimit = 5) {
    this.concurrentLimit = concurrentLimit;
  }

  /**
   * ➕ Add New Request
   *
   * Adds a request to the queue or processes it.
   * Like helping someone cross when it's safe! 🚶‍♂️
   *
   * @template T - Type of response we expect
   * @param {function} request - The request to process
   * @returns {Promise<T>} The request's result
   */
  async add<T>(request: () => Promise<T>): Promise<T> {
    if (this.activeRequests < this.concurrentLimit) {
      this.activeRequests++;
      try {
        return await request();
      } finally {
        this.activeRequests--;
        this.processQueue();
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await request());
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * 🔄 Process Queue
   *
   * Handles requests waiting in the queue.
   * Like letting the next group cross! 🚸
   *
   * @private
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (
      this.queue.length > 0 &&
      this.activeRequests < this.concurrentLimit
    ) {
      const request = this.queue.shift();
      if (request) {
        this.activeRequests++;
        try {
          await request();
        } finally {
          this.activeRequests--;
        }
      }
    }

    this.processing = false;
  }
}
