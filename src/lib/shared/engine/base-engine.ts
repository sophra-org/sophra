import { Logger } from "@/lib/shared/types";
import { BaseProcessor } from "./processors";

export class BaseEngine {
  protected processors: BaseProcessor[] = [];

  constructor(protected logger: Logger) {}

  registerProcessor(processor: BaseProcessor): void {
    this.processors.push(processor);
  }

  unregisterProcessor(processor: BaseProcessor): void {
    const index = this.processors.indexOf(processor);
    if (index !== -1) {
      this.processors.splice(index, 1);
    }
  }

  async run(): Promise<void> {
    for (const processor of this.processors) {
      try {
        await processor.process();
      } catch (error) {
        console.error("Error running processor:", error);
      }
    }
  }
}
