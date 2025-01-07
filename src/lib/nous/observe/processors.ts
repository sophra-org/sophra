import { Logger } from "@/lib/shared/types";

export interface ProcessorConfig {
  logger: Logger;
}

export class TimeBasedProcessor {
  private logger: Logger;

  constructor(config: ProcessorConfig) {
    this.logger = config.logger;
  }

  extract_features(signal: any) {
    try {
      const metadata = signal.metadata || {};
      const query = metadata.query || "";
      const results = Array.isArray(metadata.results) ? metadata.results : [];
      const responseTime = typeof metadata.responseTime === "number" ? metadata.responseTime : 0;
      const errors = Array.isArray(metadata.errors) ? metadata.errors : [];
      const timestamp = signal.timestamp || new Date();

      const hour = timestamp.getHours();
      const day = timestamp.getDay();

      return {
        query_length: query.length,
        results_count: results.length,
        response_time: responseTime,
        error_count: errors.length,
        is_weekend: day === 0 || day === 6,
        is_business_hours: hour >= 9 && hour < 17,
      };
    } catch (error) {
      this.logger.error("Failed to extract features", { error, signal });
      return {
        query_length: 0,
        results_count: 0,
        response_time: 0,
        error_count: 0,
        is_weekend: false,
        is_business_hours: false,
      };
    }
  }

  detect_patterns(signals: any[]) {
    try {
      if (signals.length < 2) {
        return [];
      }

      const features = signals.map(signal => this.extract_features(signal));
      const patterns = [];

      // Detect time-based patterns
      const avgResponseTime = features.reduce((sum, f) => sum + f.response_time, 0) / features.length;
      const avgResultsCount = features.reduce((sum, f) => sum + f.results_count, 0) / features.length;

      if (avgResponseTime > 100) {
        patterns.push({
          type: "time_based",
          confidence: 0.8,
          description: "High average response time",
          value: avgResponseTime,
        });
      }

      if (avgResultsCount > 5) {
        patterns.push({
          type: "time_based",
          confidence: 0.7,
          description: "High average results count",
          value: avgResultsCount,
        });
      }

      return patterns;
    } catch (error) {
      this.logger.error("Failed to detect patterns", { error, signals });
      return [];
    }
  }
}

export class SearchSignalProcessor {
  private logger: Logger;

  constructor(config: ProcessorConfig) {
    this.logger = config.logger;
  }

  process_signal(signal: any) {
    try {
      if (signal.type !== "search") {
        return null;
      }

      if (!signal.metadata) {
        this.logger.error("Failed to process search signal", {
          error: "Missing metadata",
          signal: signal,
        });
        return null;
      }

      const features = this.extract_features(signal);
      const patterns: Array<{ type: string; confidence: number; description: string; value: number }> = [];

      return {
        ...signal,
        metadata: {
          ...signal.metadata,
          features,
          patterns,
        },
      };
    } catch (error) {
      this.logger.error("Failed to process search signal", {
        error: error instanceof Error ? error.message : String(error),
        signal: signal,
      });
      return null;
    }
  }

  extract_features(signal: any) {
    try {
      const metadata = signal.metadata || {};
      const query = metadata.query || "";
      const results = Array.isArray(metadata.results) ? metadata.results : [];
      const responseTime = typeof metadata.responseTime === "number" ? metadata.responseTime : 0;
      const relevance = typeof metadata.relevance === "number" ? metadata.relevance : 0;

      return {
        query_length: query.length,
        results_count: results.length,
        response_time: responseTime,
        relevance_score: relevance,
      };
    } catch (error) {
      this.logger.error("Failed to extract search features", { error, signal });
      return {
        query_length: 0,
        results_count: 0,
        response_time: 0,
        relevance_score: 0,
      };
    }
  }

  detect_patterns(signals: any[]) {
    try {
      if (signals.length < 2) {
        return [];
      }

      const features = signals.map(signal => this.extract_features(signal));
      const patterns = [];

      // Detect search patterns
      const avgRelevance = features.reduce((sum, f) => sum + f.relevance_score, 0) / features.length;
      const avgResponseTime = features.reduce((sum, f) => sum + f.response_time, 0) / features.length;

      if (avgRelevance > 0.7) {
        patterns.push({
          type: "search_pattern",
          confidence: 0.8,
          description: "High average relevance",
          value: avgRelevance,
        });
      }

      if (avgResponseTime < 50) {
        patterns.push({
          type: "search_pattern",
          confidence: 0.7,
          description: "Low average response time",
          value: avgResponseTime,
        });
      }

      return patterns;
    } catch (error) {
      this.logger.error("Failed to detect search patterns", { error, signals });
      return [];
    }
  }
}
