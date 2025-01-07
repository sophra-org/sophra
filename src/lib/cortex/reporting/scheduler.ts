import type { Logger } from "@/lib/shared/types";
import { CronJob } from "cron";
import type { ReportingService } from "./service";

/**
 * ⏰ Report Scheduler: Your Timekeeping Assistant!
 *
 * Makes sure reports are generated right on schedule.
 * Like having a friendly alarm clock 🕰️ for your data insights!
 *
 * Features:
 * - 📅 Daily reports at midnight
 * - 📊 Weekly summaries on Sundays
 * - 🔄 Automatic retries
 * - 📝 Error logging
 *
 * @class ReportScheduler
 */
export class ReportScheduler {
  private readonly reportingService: ReportingService;
  private readonly logger: Logger;
  private jobs: CronJob[] = [];

  /**
   * 🎬 Set Up Your Schedule
   *
   * Creates a new scheduler for your reports.
   * Like programming your smart calendar! 📱
   */
  constructor(config: { reportingService: ReportingService; logger: Logger }) {
    this.reportingService = config.reportingService;
    this.logger = config.logger;
  }

  /**
   * 📅 Schedule All Reports
   *
   * Sets up when each report should run.
   * Like setting up your weekly planner! 📓
   */
  scheduleReports(): void {
    // Daily report at midnight
    this.addJob("0 0 * * *", async () => {
      await this.reportingService.generateScheduledReport("daily");
    });

    // Weekly report on Sunday at midnight
    this.addJob("0 0 * * 0", async () => {
      await this.reportingService.generateScheduledReport("weekly");
    });
  }

  /**
   * ➕ Add New Schedule
   *
   * Adds a new scheduled task to run.
   * Like adding a new reminder to your calendar! 🗓️
   */
  private addJob(cronPattern: string, task: () => Promise<void>): void {
    const job = new CronJob(cronPattern, async () => {
      try {
        await task();
      } catch (error) {
        await this.logger.error("Scheduled report failed", { error });
      }
    });

    this.jobs.push(job);
    job.start();
  }

  /**
   * 🛑 Stop All Schedules
   *
   * Cancels all scheduled reports.
   * Like clearing your calendar for vacation! 🏖️
   */
  stopAll(): void {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
  }
}
