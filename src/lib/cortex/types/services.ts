import type { AnalyticsService } from "@/lib/cortex/analytics/service";
import type { DataSyncService } from "@/lib/cortex/core/sync-service";
import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import type {
  BaseDocument,
  ProcessedDocumentMetadata,
} from "@/lib/cortex/elasticsearch/types";
import type { SearchABTestingService } from "@/lib/cortex/feedback/ab-testing";
import type { FeedbackService } from "@/lib/cortex/feedback/service";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { PostgresDataService } from "@/lib/cortex/postgres/services";
import type { RedisCacheService } from "@/lib/cortex/redis/services";
import type { VectorizationService } from "@/lib/cortex/services/vectorization";
import type { SessionService } from "@/lib/cortex/sessions/service";
import type { EventCollector } from "@/lib/nous/observe/collector";
import type { SignalCoordinator } from "@/lib/nous/observe/coordinator";
import type { LearningEventService } from "@/lib/nous/types/learning";
import type { LearningEngine } from "@/lib/shared/engine";

/**
 * 🎭 Services Types: Your App's Cast & Crew!
 *
 * All the different services that make your app work.
 * Like having a playbill that lists all the performers! 🎬
 */

/**
 * 🎪 Services: Your App's Ensemble
 *
 * All the services working together in harmony.
 * Like a well-rehearsed theater troupe! 🎭
 *
 * Cast Members:
 * - �� Elasticsearch (The Searcher)
 * - 📚 Postgres (The Librarian)
 * - ⚡ Redis (The Speed Demon)
 * - 🧠 Vectorization (The AI Helper)
 * - 📊 Analytics (The Statistician)
 * - 🎯 AB Testing (The Experimenter)
 * - 💭 Feedback (The Listener)
 * - 📈 Metrics (The Measurer)
 * - 👥 Sessions (The Doorkeeper)
 * - 🔄 Sync (The Coordinator)
 * - 📊 Observe (The Observer)
 * - 📊 Tracking (The Tracker)
 * - 📊 Learning (The Learner)
 *
 * @interface Services
 */
export interface Services {
  elasticsearch: ElasticsearchService;
  redis: RedisCacheService;
  postgres: PostgresDataService;
  vectorization: VectorizationService;
  analytics: AnalyticsService;
  abTesting: SearchABTestingService;
  feedback: FeedbackService;
  metrics: MetricsService;
  sessions: SessionService;
  observe: {
    collector: EventCollector;
    coordinator: SignalCoordinator;
  };
  learning: LearningEventService;
  engine: {
    instance: LearningEngine | null;
    testService(): Promise<{
      operational: boolean;
      latency: number;
      errors: string[];
      metrics: {
        status: string;
        uptime: number;
        operations: {
          total: number;
          successful: number;
          failed: number;
          pending: number;
        };
        performance: {
          latency: number;
          throughput: number;
          errorRate: number;
          cpuUsage: number;
          memoryUsage: number;
        };
      };
    }>;
  };
  sync: {
    /**
     * 🔄 Get Sync Service
     *
     * Gets the service that keeps everything in sync.
     * Like finding the stage manager! 🎭
     */
    getSyncService(): Promise<DataSyncService>;

    /**
     * 🧠 Process Document
     *
     * Turns a document into AI-readable format.
     * Like teaching an actor their lines! 📝
     */
    vectorizeDocument(params: { index: string; id: string }): Promise<void>;

    /**
     * 📝 Update or Create Document
     *
     * Saves or updates a document.
     * Like updating the script! 📚
     */
    upsertDocument(params: {
      index: string;
      id: string;
      document: Partial<BaseDocument>;
      tableName: string;
    }): Promise<{ id: string }>;

    /**
     * 🗑️ Remove Document
     *
     * Deletes a document from the system.
     * Like removing a scene from the play! ✂️
     */
    deleteDocument(params: {
      index: string;
      id: string;
      tableName: string;
    }): Promise<void>;
  };
  documents: {
    /**
     * ✨ Create New Document
     *
     * Adds a new document to the system.
     * Like adding a new scene to the play! 📝
     */
    createDocument(params: {
      index: string;
      id: string;
      document: BaseDocument;
    }): Promise<ProcessedDocumentMetadata>;

    /**
     * 🔍 Find Document
     *
     * Retrieves a document by its ID.
     * Like finding a specific page in the script! 📖
     */
    getDocument(id: string): Promise<BaseDocument & ProcessedDocumentMetadata>;

    /**
     * 📝 Update Document
     *
     * Changes an existing document.
     * Like revising a scene! ✏️
     */
    updateDocument(id: string, document: Partial<BaseDocument>): Promise<void>;

    /**
     * 🗑️ Delete Document
     *
     * Removes a document completely.
     * Like cutting a scene! ✂️
     */
    deleteDocument(id: string): Promise<void>;
  };
  health: {
    /**
     * ���� Check System Health
     *
     * Makes sure everything is working right.
     * Like doing a pre-show equipment check! 🔧
     */
    check(): Promise<{
      success: boolean;
      error?: string;
      data: {
        elasticsearch: boolean;
        postgres: boolean;
        redis: boolean;
        sync: boolean;
        timestamp: string;
      };
    }>;
  };
}
