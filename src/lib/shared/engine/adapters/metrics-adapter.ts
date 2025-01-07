import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { Logger } from "@/lib/shared/types";

export class MetricsAdapter {
  sampleRate: number = 1.0;
  batchSize: number = 100;

  constructor(
    private metrics: MetricsService,
    private logger: Logger
  ) {}

  getAverageLatency = () => this.metrics.getAverageLatency();
  getThroughput = () => this.metrics.getThroughput();
  getErrorRate = () => this.metrics.getErrorRate();
  getCPUUsage = () => this.metrics.getCPUUsage();
  getMemoryUsage = () => this.metrics.getMemoryUsage();

  recordEngineMetric = (data: any) => this.metrics.recordEngineMetric(data);
  recordLearningMetrics = (data: any) =>
    this.metrics.recordLearningMetrics(data);
}
