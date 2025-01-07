// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AnalyticsReport } from "@/lib/cortex/analytics/types";

/**
 * 💡 Recommendation: Smart Suggestions
 *
 * A helpful suggestion to make things better.
 * Like having a wise owl 🦉 giving you advice!
 *
 * @interface Recommendation
 * @property {string} type - What kind of advice (cache/performance/etc)
 * @property {string} priority - How important it is
 * @property {string} message - The friendly advice
 * @property {Object} metrics - Numbers to back up the advice
 * @property {string} [action] - What you can do about it
 */
export interface Recommendation {
  type: "cache" | "performance" | "resource" | "error";
  priority: "low" | "medium" | "high" | "critical";
  message: string;
  metrics: Record<string, number>;
  action?: string;
}

/**
 * ⚠️ Alert Configuration: Your Early Warning System
 *
 * Rules for when to raise alerts about issues.
 * Like setting up smoke detectors 🚨 for your data!
 *
 * @interface AlertConfig
 * @property {string} metric - What to watch
 * @property {string} operator - How to compare (greater/less/equal)
 * @property {number} value - The trigger point
 * @property {string} severity - How serious it is
 */
export interface AlertConfig {
  metric: keyof AnalyticsReport["metrics"];
  operator: "gt" | "lt" | "eq";
  value: number;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * 📬 Distribution Configuration: Your Report Delivery System
 *
 * How and where to send your reports.
 * Like having a magical postal service 🧙‍♂️ for your insights!
 *
 * @interface DistributionConfig
 * @property {Object} [email] - Email delivery settings
 * @property {Object} [slack] - Slack notification settings
 * @property {Object} [storage] - Where to save reports
 */
export interface DistributionConfig {
  email?: {
    recipients: string[];
    frequency: "daily" | "weekly" | "monthly";
  };
  slack?: {
    webhook: string;
    channel: string;
  };
  storage?: {
    type: "s3" | "gcs" | "local";
    path: string;
  };
}

/**
 * 📊 Report Type: What Story to Tell
 *
 * The kind of report you want to generate.
 * Like choosing which section of the newspaper to read! 📰
 */
export type ReportType = "performance" | "usage" | "error" | "analytics";

/**
 * 📋 Report Configuration: Your Story Requirements
 *
 * Settings for generating a specific report.
 * Like giving instructions to your reporter! 📝
 *
 * @interface ReportConfig
 * @property {ReportType} type - What kind of report
 * @property {string} timeWindow - Time period to cover
 * @property {string[]} recipients - Who should receive it
 * @property {"html" | "json" | "pdf"} format - How it should look
 * @property {string} [schedule] - When to generate it (cron format)
 */
export interface ReportConfig {
  type: ReportType;
  timeWindow: string;
  recipients: string[];
  format: "html" | "json" | "pdf";
  schedule?: string;
}

/**
 * 📈 Report Data: Your Story's Content
 *
 * The actual content of a generated report.
 * Like the finished newspaper article! 📰
 *
 * @interface ReportData
 * @property {ReportType} type - What kind of report it is
 * @property {Object} data - The actual report content
 * @property {Date} timestamp - When it was generated
 * @property {"html" | "json" | "pdf"} format - How it's formatted
 */
export interface ReportData {
  type: ReportType;
  data: {
    metrics: Record<string, number>;
    recommendations: Recommendation[];
    alerts: Array<{
      type: string;
      severity: string;
      message: string;
      metric: string;
    }>;
  };
  timestamp: Date;
  format: "html" | "json" | "pdf";
}
