import { Event, EventType } from "@/lib/nous/types";
import logger from "@/lib/shared/logger";

export class TrainingScheduler {
  private lastTraining: Date | null = null;

  constructor(
    private options = {
      minEvents: 1000,
      trainingIntervalDays: 7,
      maxCostPerTraining: 50.0,
    }
  ) {}

  shouldTrain(events: Event[]): boolean {
    if (events.length < this.options.minEvents) {
      logger.info(
        `Not enough events for training: ${events.length} < ${this.options.minEvents}`
      );
      return false;
    }

    if (
      this.lastTraining &&
      Date.now() - this.lastTraining.getTime() <
        this.options.trainingIntervalDays * 24 * 60 * 60 * 1000
    ) {
      logger.info("Training interval not reached");
      return false;
    }

    // Check event distribution
    const eventTypes = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<EventType, number>
    );

    if (
      (eventTypes[EventType.SEARCH] || 0) < this.options.minEvents * 0.4 ||
      (eventTypes[EventType.USER] || 0) < this.options.minEvents * 0.2
    ) {
      logger.info("Insufficient event type distribution for training");
      return false;
    }

    return true;
  }

  // ... rest of the implementation following Python version
  // Including start, stop, forceTraining, etc.
}
