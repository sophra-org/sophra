import type { AnalyticsReport } from "@/lib/cortex/analytics/types";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import type { Logger } from "@/lib/shared/types";

/**
 * 🚨 Alert Service: Your Watchful Guardian!
 *
 * Keeps an eye on your system and lets you know if something needs attention.
 * Like having a friendly guard dog that watches over your data! 🐕
 *
 * Features:
 * - 📊 Metric monitoring
 * - ⚠️ Smart alerts
 * - 🎯 Custom thresholds
 * - 📝 Detailed logging
 *
 * @class AlertService
 */

/**
 * 🎯 Alert Threshold: Your Safety Limits
 *
 * Rules for when to raise an alert.
 * Like setting up guard rails to keep you safe! 🛡️
 *
 * @interface AlertThreshold
 * @property {string} metric - What to watch
 * @property {string} operator - How to compare values
 * @property {number} value - When to alert
 * @property {string} severity - How urgent it is
 */
interface AlertThreshold {
  metric: string;
  operator: "gt" | "lt" | "eq";
  value: number;
  severity: "info" | "warning" | "critical";
}

export class AlertService {
  private readonly logger: Logger;
  private readonly metrics: MetricsService;
  private readonly thresholds: Map<string, AlertThreshold[]>;

  /**
   * 🎬 Set Up Your Guardian
   *
   * Creates a new alert watcher for your system.
   * Like hiring a security guard! 💂‍♂️
   */
  constructor(config: { logger: Logger; metrics: MetricsService }) {
    this.logger = config.logger;
    this.metrics = config.metrics;
    this.thresholds = new Map();
  }

  /**
   * 🔍 Check All Thresholds
   *
   * Looks at your system's health and raises alerts if needed.
   * Like doing a security patrol of your data! 🚶‍♂️
   *
   * @param {AnalyticsReport} report - System health report
   */
  async checkThresholds(report: AnalyticsReport): Promise<void> {
    for (const [metric, value] of Object.entries(report.metrics)) {
      const thresholds = this.thresholds.get(metric);
      if (thresholds) {
        for (const threshold of thresholds) {
          if (this.isThresholdViolated(value as number, threshold)) {
            await this.triggerAlert(metric, value as number, threshold);
          }
        }
      }
    }
  }

  /**
   * ⚖️ Check If Threshold Is Crossed
   *
   * Compares a value against its safety limit.
   * Like checking if something is too hot or cold! 🌡️
   */
  private isThresholdViolated(
    value: number,
    threshold: AlertThreshold
  ): boolean {
    switch (threshold.operator) {
      case "gt":
        return value > threshold.value;
      case "lt":
        return value < threshold.value;
      case "eq":
        return value === threshold.value;
    }
  }

  /**
   * 📢 Sound the Alarm
   *
   * Lets everyone know when something needs attention.
   * Like ringing a friendly warning bell! 🔔
   */
  private async triggerAlert(
    metric: string,
    value: number,
    threshold: AlertThreshold
  ): Promise<void> {
    this.logger.error(`Alert: ${metric} threshold violated`, {
      metric,
      value,
      threshold,
      severity: threshold.severity,
    });

    this.metrics.recordAlert(metric, {
      severity: threshold.severity,
      threshold: threshold.value,
      value: value,
      actual: value,
    });
  }
}
