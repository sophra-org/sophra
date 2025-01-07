import { MetricsService } from '../../../cortex/monitoring/metrics';
import { MetricType } from "@prisma/client";
import Redis from "ioredis";

export class RedisAdapter {
  private client: Redis;

  constructor(private metrics: MetricsService) {
    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
    });
  }

  async get(key: string): Promise<string | null> {
    const start = Date.now();
    try {
      const result = await this.client.get(key);
      this.metrics.recordEngineMetric({
        type: MetricType.REDIS_GET,
        value: Date.now() - start,
        confidence: 1,
      });
      return result;
    } catch (error) {
      this.metrics.recordEngineMetric({
        type: MetricType.REDIS_ERROR,
        value: 1,
        confidence: 1,
        metadata: { error: String(error) },
      });
      throw error;
    }
  }

  // ... other Redis methods with metrics
}
