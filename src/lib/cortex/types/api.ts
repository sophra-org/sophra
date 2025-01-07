/**
 * 🌐 API Types: Your Web Communication Blueprint!
 *
 * All the building blocks for talking to the web.
 * Like having a magical telephone that speaks web! 📞
 */

/**
 * 📨 API Response: Messages from the Server
 *
 * How the server responds to your requests.
 * Like getting a letter back from your pen pal! ✉️
 *
 * @interface APIResponse
 * @template T - Type of data in the response
 * @property {boolean} success - Did everything work?
 * @property {T} [data] - The goodies we sent back
 * @property {string} [error] - What went wrong (if anything)
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 🏥 Health Status: Your System's Checkup Report
 *
 * How healthy your system is feeling.
 * Like getting a doctor's report for your app! 👨‍⚕️
 *
 * @interface HealthStatus
 * @property {boolean} elasticsearch - Is search working?
 * @property {boolean} postgres - Is database working?
 * @property {boolean} redis - Is cache working?
 * @property {boolean} sync - Is syncing working?
 * @property {string} timestamp - When we checked
 */
export interface HealthStatus {
  elasticsearch: boolean;
  postgres: boolean;
  redis: boolean;
  sync: boolean;
  timestamp: string;
  error?: string;
  stats?: {
    elasticsearch?: {
      indices: number;
      documents: number;
      size: string;
      health: 'green' | 'yellow' | 'red';
    };
    services: {
      [key: string]: {
        latency: number;
        errors?: string[];
      };
    };
  };
}

/**
 * 📊 Enhanced Health Status: Your Super Detailed Checkup!
 *
 * A really thorough look at system health.
 * Like getting a full-body scan at the doctor! 🏥
 *
 * Features:
 * - 🔍 Elasticsearch vitals
 * - 💾 Redis performance
 * - 📚 Postgres stats
 *
 * @interface EnhancedHealthStatus
 * @extends {HealthStatus}
 */
export interface EnhancedHealthStatus extends HealthStatus {
  metrics: {
    elasticsearch: {
      indices: {
        count: number;
        totalSize: string;
        docsCount: number;
        health: 'green' | 'yellow' | 'red';
      };
      cluster: {
        status: string;
        nodeCount: number;
        cpuUsage: number;
        memoryUsage: {
          total: string;
          used: string;
          free: string;
        };
      };
      performance: {
        queryLatency: number;
        indexingLatency: number;
        searchRate: number;
        indexingRate: number;
      };
    };
    redis: {
      memory: {
        used: string;
        peak: string;
        fragmentationRatio: number;
      };
      hits: {
        keyspaceHits: number;
        keyspaceMisses: number;
        hitRate: number;
      };
      performance: {
        connectedClients: number;
        blockedClients: number;
        opsPerSecond: number;
      };
    };
    postgres: {
      connections: {
        active: number;
        idle: number;
        max: number;
      };
      performance: {
        queryLatency: number;
        transactionsPerSecond: number;
        cacheHitRatio: number;
      };
      storage: {
        databaseSize: string;
        tableCount: number;
      };
    };
  };
}
