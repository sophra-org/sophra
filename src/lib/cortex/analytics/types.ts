export interface AnalyticsMetrics {
  totalSearches: number;
  averageLatency: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  queryCount: number;
  uniqueUsers: number;
  avgResultsPerQuery: number;
  clickThroughRate: number;
  conversionRate: number;
  avgRelevanceScore: number;
  p95Latency: number;
  p99Latency: number;
  resourceUtilization: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
  searchTypes: {
    text: number;
    vector: number;
    hybrid: number;
  };
  timeWindow?: "hourly" | "daily" | "weekly" | "monthly";
}

export interface AnalyticsTrend {
  metric: string;
  current: number;
  change: number;
  trend: "increasing" | "decreasing" | "stable";
}

export interface PerformanceInsight {
  type: "cache" | "search" | "resource" | "error";
  severity: "high" | "medium" | "low";
  message: string;
  metric: string;
  currentValue: number;
  recommendedValue: number | null;
  action: string;
}

export interface AnalyticsReport {
  timeWindow: string;
  generatedAt: Date;
  metrics: {
    totalSearches: number;
    averageLatency: number;
    cacheHitRate: number;
    errorRate: number;
  };
  trends: AnalyticsTrend[];
  insights: PerformanceInsight[];
  popularQueries: Array<{
    query: string;
    count: number;
    avgLatency: number;
    cacheHitRate: number;
  }>;
}
