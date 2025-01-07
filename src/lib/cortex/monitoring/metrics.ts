import { AnalyticsMetrics } from "@/lib/cortex/analytics/types";
import type { SearchFeedbackData } from "@/lib/cortex/feedback/service";
import { MetricsService as NousMetricsService } from "@/lib/cortex/monitoring/metrics";
import { TestMetrics } from "@/lib/nous/engine/types";
import type { Logger } from "@/lib/shared/types";
import { MetricType } from "@prisma/client";
import { Counter, Gauge, Registry, collectDefaultMetrics } from "prom-client";
import { metricsConfig } from "./metrics-config";

interface _MetricsLabels {
  type: string;
  service: string;
  operation: string;
}

interface ElasticsearchErrorParams {
  error_type: string;
  index: string;
  search_type?: string;
}

export interface IMetricsService {
  recordLatency(name: string, type: string, value: number): void;
  incrementError(name: string, service: string, operation: string): void;
  updateResourceUsage(metrics: ResourceMetrics): void;
  updateCacheHitRatio(hits: number, misses: number): void;
  updateSearchQuality(metrics: {
    relevance: number;
    conversion_rate: number;
    click_through_rate?: number;
    query_hash?: string;
  }): void;
  recordAlert(
    metric: string,
    data: {
      threshold: number;
      value: number;
      actual: number;
      severity: "info" | "warning" | "critical";
    }
  ): void;
  recordReportDistribution(params: {
    report_type: string;
    recipient_count: number;
    type: string;
    timeWindow: string;
  }): void;
}

interface ResourceMetrics {
  memory: {
    used: number;
    total: number;
  };
  cpu: {
    usage: number;
  };
}

export interface EngineMetrics {
  averageLatency: number;
  requestsPerSecond: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  pendingOperations: number;
}

export class MetricsService implements NousMetricsService {
  private readonly logger: Logger;
  private readonly registry: Registry;
  private readonly errorCounter: Counter<string>;
  private readonly operationLatency: Gauge<string>;
  private readonly abTestMetrics: Gauge<string>;
  private readonly analyticsMetrics: Gauge<string>;
  private readonly searchFeedback: Counter<string>;
  private metrics = {
    averageLatency: 0,
    throughput: 0,
    errorRate: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    pendingOperations: 0,
  };
  public sampleRate: number = 1.0;
  public batchSize: number = 100;
  private baselineLoad = 0;
  private currentLoad = 0;

  public recordEngineMetric = async (data: {
    type: MetricType;
    value: number;
    confidence: number;
    metadata?: Record<string, unknown>;
    operationId?: string;
  }): Promise<void> => {
    try {
      if (typeof data.value !== 'number') {
        throw new Error('Invalid metric value');
      }

      this.analyticsMetrics
        .labels(data.type, String(data.value), data.operationId || "default")
        .set(data.value);

      this.logger.debug('Recording engine metric', data);
    } catch (error) {
      this.logger.error('Failed to record engine metric', {
        error,
        metric: data
      });
    }
  };

  public recordLearningMetrics = (
    data: {
      type: MetricType;
      value: number;
      interval: string;
      sessionId?: string;
      modelId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> => {
    this.analyticsMetrics
      .labels(data.type, String(data.value), data.interval)
      .set(data.value);
    return Promise.resolve();
  };

  constructor({ logger, environment }: { logger: Logger; environment: string }) {
    this.logger = logger;
    this.registry = new Registry();

    // Initialize default metrics collection
    collectDefaultMetrics({
      register: this.registry,
      prefix: metricsConfig.prefix,
      labels: { ...metricsConfig.defaultLabels },
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    this.errorCounter = new Counter({
      name: "sophra_errors_total",
      help: "Total number of errors",
      labelNames: ["type", "service", "operation"],
      registers: [this.registry],
    });

    this.operationLatency = new Gauge({
      name: "sophra_operation_latency",
      help: "Operation latency in milliseconds",
      labelNames: ["operation", "service", "value"],
      registers: [this.registry],
    });

    this.searchFeedback = new Counter({
      name: "sophra_search_feedback",
      help: "Search feedback metrics",
      labelNames: ["user_action", "query_hash", "relevance_score"],
      registers: [this.registry],
    });

    this.abTestMetrics = new Gauge({
      name: "sophra_abtest_metrics",
      help: "A/B test metrics",
      labelNames: ["test_id", "variant_id", "query_hash", "metric_type"],
      registers: [this.registry],
    });

    this.analyticsMetrics = new Gauge({
      name: "sophra_analytics_metrics",
      help: "Analytics metrics",
      labelNames: ["metric_type", "value", "time_window"],
      registers: [this.registry],
    });
  }
  updateSearchQuality(metrics: {
    relevance: number;
    conversion_rate: number;
    click_through_rate?: number;
    query_hash?: string;
  }): void {
    const queryHash = metrics.query_hash || "current";

    this.analyticsMetrics
      .labels("search_relevance", String(metrics.relevance), queryHash)
      .set(metrics.relevance);

    this.analyticsMetrics
      .labels("conversion_rate", String(metrics.conversion_rate), queryHash)
      .set(metrics.conversion_rate);

    if (metrics.click_through_rate !== undefined) {
      this.analyticsMetrics
        .labels("click_through_rate", String(metrics.click_through_rate), queryHash)
        .set(metrics.click_through_rate);
    }

    this.logger.debug('Updating search quality metrics', {
      ...metrics,
      query_hash: queryHash
    });
  }
  recordAlert(
    metric: string,
    data: {
      threshold: number;
      value: number;
      actual: number;
      severity: "info" | "warning" | "critical";
    }
  ): void {
    this.analyticsMetrics
      .labels(`${metric}_alert`, String(data.actual), data.severity)
      .set(data.actual);

    this.analyticsMetrics
      .labels(`${metric}_threshold`, String(data.threshold), data.severity)
      .set(data.threshold);

    this.logger.debug('Recording metric alert', {
      metric,
      ...data
    });
  }
  recordReportDistribution(params: {
    report_type: string;
    recipient_count: number;
    type: string;
    timeWindow: string;
  }): void {
    this.analyticsMetrics
      .labels(
        "report_distribution",
        String(params.recipient_count),
        params.timeWindow
      )
      .set(params.recipient_count);

    this.logger.debug('Recording report distribution', {
      ...params
    });
  }

  public updateCacheHitRatio(hits: number, misses: number): void {
    const total = hits + misses;
    if (total > 0) {
      const ratio = hits / total;
      this.analyticsMetrics
        .labels("cache_hit_ratio", ratio.toString(), "1m")
        .set(ratio);
      this.logger.debug("Updating cache hit ratio", { hits, misses, ratio });
    }
  }

  public incrementError(type: string, service: string, operation: string): void {
    this.errorCounter.labels(type, service, operation).inc();
    this.logger.debug('Incrementing error counter', {
      error: type,
      service,
      operation
    });
  }

  public recordLatency(
    operation: string,
    service: string,
    value: number
  ): void {
    this.operationLatency
      .labels(operation, service, String(value))
      .set(value);
    
    this.logger.debug('Recording latency', {
      operation,
      service,
      latency: value
    });
  }

  public observeSearchFeedback(feedback: SearchFeedbackData): void {
    this.searchFeedback
      .labels(
        feedback.userAction,
        feedback.queryHash,
        feedback.relevanceScore.toString()
      )
      .inc();
  }

  public incrementSearchError(params: ElasticsearchErrorParams): void {
    this.incrementError(
      params.error_type,
      "search",
      params.search_type
        ? `${params.search_type}_search_${params.index}`
        : `search_${params.index}`
    );
  }

  public incrementIndexError(params: ElasticsearchErrorParams): void {
    this.incrementError(
      params.error_type,
      "elasticsearch",
      `index_${params.index}`
    );
  }

  public incrementUpdateError(params: ElasticsearchErrorParams): void {
    this.incrementError(
      params.error_type,
      "elasticsearch",
      `update_${params.index}`
    );
  }

  public incrementDeleteError(params: ElasticsearchErrorParams): void {
    this.incrementError(
      params.error_type,
      "elasticsearch",
      `delete_${params.index}`
    );
  }

  public incrementBulkError(params: ElasticsearchErrorParams): void {
    this.incrementError(
      params.error_type,
      "elasticsearch",
      `bulk_${params.index}`
    );
  }

  public updateABTestMetrics(params: {
    test_id: string;
    variant_id: string;
    query_hash: string;
    metrics: Record<string, number>;
  }): void {
    const { test_id, variant_id, query_hash, metrics } = params;
    Object.entries(metrics).forEach(([metric_type, value]) => {
      this.abTestMetrics
        .labels(test_id, variant_id, query_hash, metric_type)
        .set(value);
    });
  }
  public updateAnalytics(metrics: AnalyticsMetrics): void {
    const { timeWindow = "hourly", ...rawMetrics } = metrics;

    // Normalize metrics keys to snake_case for consistency
    const normalizedMetrics = Object.entries(rawMetrics).reduce(
      (acc, [key, value]) => {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        acc[snakeKey] = typeof value === "number" ? value : 0;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(normalizedMetrics).forEach(([metric_type, value]) => {
      this.analyticsMetrics
        .labels(metric_type, String(value), String(timeWindow))
        .set(value);
    });
  }

  public async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  public incrementMetric(
    name: string,
    labels: Record<string, string | number>
  ): void {
    const normalizedLabels = Object.entries(labels).reduce(
      (acc, [key, value]) => {
        acc[key.replace(/([A-Z])/g, "_$1").toLowerCase()] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );

    this.errorCounter
      .labels(
        normalizedLabels.type || "unknown",
        normalizedLabels.service || "unknown",
        normalizedLabels.operation || name
      )
      .inc();
  }

  public updateResourceUsage(metrics: ResourceMetrics): void {
    try {
      const { memory, cpu } = metrics;

      if (!memory || !cpu || typeof memory.used !== 'number' || typeof memory.total !== 'number' || typeof cpu.usage !== 'number') {
        throw new Error('Invalid resource metrics');
      }

      this.analyticsMetrics
        .labels("memory_used", String(memory.used), "current")
        .set(memory.used);

      this.analyticsMetrics
        .labels("memory_total", String(memory.total), "current")
        .set(memory.total);

      this.analyticsMetrics
        .labels("cpu_usage", String(cpu.usage), "current")
        .set(cpu.usage);

      this.logger.debug('Updating resource usage metrics', {
        cpuUsage: cpu.usage,
        memoryUsage: memory.used,
        memoryTotal: memory.total
      });
    } catch (error) {
      this.logger.error('Failed to update resource metrics', {
        error,
        metrics
      });
    }
  }

  public hasMetric(name: string): boolean {
    return this.registry.getSingleMetric(name) !== undefined;
  }

  public createHistogram(name: string, help: string): void {
    if (!this.hasMetric(name)) {
      new Counter({
        name: `sophra_${name}`,
        help,
        labelNames: ["operation", "service"],
        registers: [this.registry],
      });
    }
  }

  public createCounter(name: string, help: string): void {
    if (!this.hasMetric(name)) {
      new Counter({
        name: `sophra_${name}`,
        help,
        labelNames: ["type", "service", "operation"],
        registers: [this.registry],
      });
    }
  }

  public static async getEngineMetrics(): Promise<EngineMetrics> {
    return {
      averageLatency: 0,
      requestsPerSecond: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      pendingOperations: 0,
    };
  }

  async getAverageLatency(): Promise<number> {
    return this.metrics.averageLatency;
  }

  async getThroughput(): Promise<number> {
    return this.metrics.throughput;
  }

  async getErrorRate(): Promise<number> {
    return this.metrics.errorRate;
  }

  async getCPUUsage(): Promise<number> {
    return this.metrics.cpuUsage;
  }

  async getMemoryUsage(): Promise<number> {
    return this.metrics.memoryUsage;
  }

  async getOperationCount(): Promise<number> {
    return this.metrics.totalOperations;
  }

  async getSuccessfulOperations(): Promise<number> {
    return this.metrics.successfulOperations;
  }

  async getFailedOperations(): Promise<number> {
    return this.metrics.failedOperations;
  }

  async getPendingOperations(): Promise<number> {
    return this.metrics.pendingOperations;
  }

  async updateMetrics(update: Partial<typeof this.metrics>): Promise<void> {
    this.metrics = { ...this.metrics, ...update };
    this.logger.debug("Updated metrics", { metrics: this.metrics });
  }

  public getCurrentLoad(): number {
    return this.currentLoad;
  }

  public getBaselineLoad(): number {
    return this.baselineLoad;
  }

  public async getMetricVariability(): Promise<number> {
    const latencyValues = await this.getLatencyHistory();
    if (!latencyValues.length) return 0.1; // default variability

    const mean =
      latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length;
    const variance =
      latencyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      latencyValues.length;
    return Math.sqrt(variance) / mean; // coefficient of variation
  }

  public async getAverageTrafficVolume(): Promise<number> {
    return this.metrics.throughput;
  }

  private async getLatencyHistory(): Promise<number[]> {
    const latencyMetric = this.registry.getSingleMetric(
      "sophra_operation_latency"
    );
    if (!latencyMetric) return [];

    return (await (latencyMetric as Gauge<string>).get()).values.map(
      (v) => v.value
    );
  }

  public async getMetricsForVariant(
    _variant: string,
    startTime: number
  ): Promise<TestMetrics> {
    return {
      latency: await this.getAverageLatency(),
      errorRate: await this.getErrorRate(),
      throughput: await this.getThroughput(),
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
    };
  }
}
