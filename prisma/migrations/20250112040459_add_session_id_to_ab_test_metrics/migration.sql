/*
  Warnings:

  - You are about to drop the `CodebaseDirectory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodebaseFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodebaseVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SYSTEM', 'USER', 'STATE_CHANGE', 'SEARCH', 'MODEL', 'FEEDBACK', 'ADAPTATION', 'LEARNING');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('SEARCH', 'PERFORMANCE', 'USER_BEHAVIOR_IMPRESSION', 'USER_BEHAVIOR_VIEW', 'USER_BEHAVIOR_CLICK', 'USER_BEHAVIOR_CONVERSION', 'MODEL_PERFORMANCE', 'FEEDBACK', 'SYSTEM_HEALTH', 'SESSION');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('IMPRESSION', 'VIEW', 'CLICK', 'CONVERSION');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('SEARCH_RANKER', 'PATTERN_DETECTOR', 'QUERY_OPTIMIZER', 'FEEDBACK_ANALYZER', 'OPENAI_FINE_TUNED');

-- CreateEnum
CREATE TYPE "RulePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'STOPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('FEEDBACK_SCORE', 'ENGAGEMENT_RATE', 'RELEVANCE_SCORE', 'CLICK_THROUGH', 'CONVERSION_RATE', 'SEARCH_LATENCY', 'MODEL_ACCURACY', 'ADAPTATION_SUCCESS', 'CACHE_EFFICIENCY', 'CACHE_HIT_RATE', 'REDIS_GET', 'REDIS_SET', 'REDIS_DELETE', 'REDIS_EXISTS', 'REDIS_ERROR', 'ERROR_RATE', 'THROUGHPUT', 'CPU_USAGE', 'MEMORY_USAGE');

-- CreateEnum
CREATE TYPE "LearningEventType" AS ENUM ('SEARCH_PATTERN', 'USER_FEEDBACK', 'MODEL_UPDATE', 'ADAPTATION_RULE', 'SIGNAL_DETECTED', 'METRIC_THRESHOLD', 'SYSTEM_STATE', 'EXPERIMENT_RESULT', 'PATTERN_DETECTION', 'STRATEGY_GENERATION', 'FEEDBACK_ANALYSIS', 'MODEL_TRAINING', 'SYSTEM_ADAPTATION');

-- CreateEnum
CREATE TYPE "LearningEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "LearningEventPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "EngineOptimizationType" AS ENUM ('WEIGHT_ADJUSTMENT', 'QUERY_TRANSFORMATION', 'INDEX_OPTIMIZATION', 'CACHE_STRATEGY');

-- CreateEnum
CREATE TYPE "EngineRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EngineOperationType" AS ENUM ('PATTERN_DETECTION', 'STRATEGY_EXECUTION', 'RULE_EVALUATION', 'ADAPTATION', 'LEARNING_CYCLE');

-- CreateEnum
CREATE TYPE "EngineOperationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "CodebaseDirectory" DROP CONSTRAINT "CodebaseDirectory_parentId_fkey";

-- DropForeignKey
ALTER TABLE "CodebaseFile" DROP CONSTRAINT "CodebaseFile_directoryId_fkey";

-- DropForeignKey
ALTER TABLE "CodebaseFile" DROP CONSTRAINT "CodebaseFile_versionId_fkey";

-- DropTable
DROP TABLE "CodebaseDirectory";

-- DropTable
DROP TABLE "CodebaseFile";

-- DropTable
DROP TABLE "CodebaseVersion";

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchAnalytics" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "totalHits" INTEGER NOT NULL,
    "took" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facetsUsed" JSONB,
    "sessionId" TEXT,
    "resultIds" JSONB,
    "page" INTEGER NOT NULL DEFAULT 1,
    "pageSize" INTEGER NOT NULL DEFAULT 10,
    "filters" JSONB,

    CONSTRAINT "SearchAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "data" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ExperimentStatus" NOT NULL,
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestAssignment" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestMetric" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "ABTestMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchFeedback" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "userAction" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "SearchFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaseEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "priority" INTEGER,
    "processed" BOOLEAN,
    "metadata" JSONB,
    "correlationId" TEXT,
    "searchEventid" TEXT,

    CONSTRAINT "BaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelEvent" (
    "id" TEXT NOT NULL,
    "baseEventId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "results" JSONB NOT NULL,

    CONSTRAINT "ModelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedSignal" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "originalSignalId" TEXT NOT NULL,
    "processingTime" DOUBLE PRECISION NOT NULL,
    "transformations" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingMetadata" JSONB,

    CONSTRAINT "ProcessedSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalBatch" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL,
    "priority" INTEGER,
    "sourceSystem" TEXT,
    "signalIds" TEXT[],

    CONSTRAINT "SignalBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalPattern" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "signalIds" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "patternType" TEXT NOT NULL,
    "frequency" DOUBLE PRECISION,
    "impactScore" DOUBLE PRECISION,
    "relatedPatterns" TEXT[],

    CONSTRAINT "SignalPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "priority" "RulePriority" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "lastTriggered" TIMESTAMP(3),

    CONSTRAINT "AdaptationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelConfig" (
    "id" TEXT NOT NULL,
    "type" "ModelType" NOT NULL,
    "hyperparameters" JSONB NOT NULL,
    "features" TEXT[],
    "trainingParams" JSONB,

    CONSTRAINT "ModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB NOT NULL,
    "artifactPath" TEXT NOT NULL,
    "parentVersion" TEXT,

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningRequest" (
    "id" TEXT NOT NULL,
    "patterns" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRequest" (
    "id" TEXT NOT NULL,
    "feedback" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelMetrics" (
    "id" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "precision" DOUBLE PRECISION NOT NULL,
    "recall" DOUBLE PRECISION NOT NULL,
    "f1Score" DOUBLE PRECISION NOT NULL,
    "latencyMs" DOUBLE PRECISION NOT NULL,
    "loss" DOUBLE PRECISION NOT NULL,
    "validationMetrics" JSONB NOT NULL,
    "customMetrics" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelState" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "weights" DOUBLE PRECISION[],
    "bias" DOUBLE PRECISION NOT NULL,
    "scaler" JSONB NOT NULL,
    "featureNames" TEXT[],
    "isTrained" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "modelType" "ModelType" NOT NULL DEFAULT 'SEARCH_RANKER',
    "hyperparameters" JSONB,
    "currentEpoch" INTEGER NOT NULL DEFAULT 0,
    "trainingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTrainingError" TEXT,

    CONSTRAINT "ModelState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "totalHits" INTEGER NOT NULL,
    "took" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facetsUsed" JSONB,
    "resultIds" JSONB,
    "page" INTEGER NOT NULL DEFAULT 1,
    "pageSize" INTEGER NOT NULL DEFAULT 10,
    "filters" JSONB,

    CONSTRAINT "SearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestMetrics" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTestMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "source" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "priority" INTEGER,
    "retries" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "error" TEXT,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsMetrics" (
    "id" TEXT NOT NULL,
    "totalSearches" INTEGER NOT NULL,
    "averageLatency" DOUBLE PRECISION NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "cacheHitRate" DOUBLE PRECISION NOT NULL,
    "queryCount" INTEGER NOT NULL,
    "uniqueUsers" INTEGER NOT NULL,
    "avgResultsPerQuery" DOUBLE PRECISION NOT NULL,
    "clickThroughRate" DOUBLE PRECISION NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "avgRelevanceScore" DOUBLE PRECISION NOT NULL,
    "p95Latency" DOUBLE PRECISION NOT NULL,
    "p99Latency" DOUBLE PRECISION NOT NULL,
    "resourceUtilization" JSONB NOT NULL,
    "searchTypes" JSONB NOT NULL,
    "timeWindow" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,

    CONSTRAINT "AnalyticsMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsTrend" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "recommendedValue" DOUBLE PRECISION,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsReport" (
    "id" TEXT NOT NULL,
    "timeWindow" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "trends" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "popularQueries" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdaptationSuggestion" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "patterns" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdaptationSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMetric" (
    "id" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interval" TEXT NOT NULL,
    "sessionId" TEXT,
    "modelId" TEXT,
    "metadata" JSONB,
    "timeframe" TEXT NOT NULL,
    "aggregated" BOOLEAN NOT NULL DEFAULT false,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "type" "LearningEventType" NOT NULL,
    "status" "LearningEventStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LearningEventPriority" NOT NULL DEFAULT 'MEDIUM',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "correlationId" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "clientId" TEXT,
    "environment" TEXT,
    "version" TEXT,
    "tags" TEXT[],
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPattern" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "metadata" JSONB,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineState" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPhase" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineOperation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "metrics" JSONB,
    "metadata" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineMetric" (
    "id" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "operationId" TEXT,

    CONSTRAINT "EngineMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineLearningResult" (
    "id" TEXT NOT NULL,
    "patterns" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "performance" JSONB,
    "validatedAt" TIMESTAMP(3),
    "abTestMetrics" JSONB,
    "operationId" TEXT NOT NULL,

    CONSTRAINT "EngineLearningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineOptimizationStrategy" (
    "id" TEXT NOT NULL,
    "type" "EngineOptimizationType" NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "learningResultId" TEXT NOT NULL,

    CONSTRAINT "EngineOptimizationStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineConfidenceScore" (
    "id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineConfidenceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchWeights" (
    "id" TEXT NOT NULL,
    "titleWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "contentWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tagWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchWeights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineRecommendation" (
    "id" TEXT NOT NULL,
    "type" "EngineOptimizationType" NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL,
    "learningResultId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB,
    "mappings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "doc_count" INTEGER NOT NULL DEFAULT 0,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "health" TEXT NOT NULL DEFAULT 'green',

    CONSTRAINT "indices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SessionToSignal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionToSignal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "registry_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT,
    "metadata" JSONB NOT NULL,
    "config" JSONB,
    "tags" TEXT[],
    "dependencies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "registry_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_metadata" (
    "id" TEXT NOT NULL,
    "entryId" TEXT,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ModelMetricsToModelState" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModelMetricsToModelState_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SearchEventToSearchFeedback" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SearchEventToSearchFeedback_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "migrations_version_key" ON "migrations"("version");

-- CreateIndex
CREATE INDEX "SearchAnalytics_timestamp_idx" ON "SearchAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "SearchAnalytics_searchType_idx" ON "SearchAnalytics"("searchType");

-- CreateIndex
CREATE INDEX "SearchAnalytics_sessionId_idx" ON "SearchAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_lastActiveAt_idx" ON "sessions"("lastActiveAt");

-- CreateIndex
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_timestamp_idx" ON "Message"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ABTestAssignment_testId_sessionId_key" ON "ABTestAssignment"("testId", "sessionId");

-- CreateIndex
CREATE INDEX "ABTestMetric_testId_variantId_idx" ON "ABTestMetric"("testId", "variantId");

-- CreateIndex
CREATE INDEX "ABTestMetric_sessionId_idx" ON "ABTestMetric"("sessionId");

-- CreateIndex
CREATE INDEX "ABTestMetric_timestamp_idx" ON "ABTestMetric"("timestamp");

-- CreateIndex
CREATE INDEX "SearchFeedback_queryHash_idx" ON "SearchFeedback"("queryHash");

-- CreateIndex
CREATE INDEX "SearchFeedback_searchId_idx" ON "SearchFeedback"("searchId");

-- CreateIndex
CREATE INDEX "BaseEvent_type_idx" ON "BaseEvent"("type");

-- CreateIndex
CREATE INDEX "BaseEvent_timestamp_idx" ON "BaseEvent"("timestamp");

-- CreateIndex
CREATE INDEX "BaseEvent_processed_idx" ON "BaseEvent"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "ModelEvent_baseEventId_key" ON "ModelEvent"("baseEventId");

-- CreateIndex
CREATE INDEX "ModelEvent_modelId_idx" ON "ModelEvent"("modelId");

-- CreateIndex
CREATE INDEX "ModelEvent_version_idx" ON "ModelEvent"("version");

-- CreateIndex
CREATE INDEX "ProcessedSignal_signalId_idx" ON "ProcessedSignal"("signalId");

-- CreateIndex
CREATE INDEX "ProcessedSignal_originalSignalId_idx" ON "ProcessedSignal"("originalSignalId");

-- CreateIndex
CREATE UNIQUE INDEX "SignalBatch_batchId_key" ON "SignalBatch"("batchId");

-- CreateIndex
CREATE INDEX "SignalBatch_startTime_endTime_idx" ON "SignalBatch"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "SignalPattern_patternId_key" ON "SignalPattern"("patternId");

-- CreateIndex
CREATE INDEX "SignalPattern_patternType_idx" ON "SignalPattern"("patternType");

-- CreateIndex
CREATE INDEX "SignalPattern_confidence_idx" ON "SignalPattern"("confidence");

-- CreateIndex
CREATE INDEX "AdaptationRule_priority_idx" ON "AdaptationRule"("priority");

-- CreateIndex
CREATE INDEX "AdaptationRule_enabled_idx" ON "AdaptationRule"("enabled");

-- CreateIndex
CREATE INDEX "ModelConfig_type_idx" ON "ModelConfig"("type");

-- CreateIndex
CREATE INDEX "ModelVersion_configId_idx" ON "ModelVersion"("configId");

-- CreateIndex
CREATE INDEX "LearningRequest_timestamp_idx" ON "LearningRequest"("timestamp");

-- CreateIndex
CREATE INDEX "FeedbackRequest_timestamp_idx" ON "FeedbackRequest"("timestamp");

-- CreateIndex
CREATE INDEX "ModelMetrics_modelVersionId_idx" ON "ModelMetrics"("modelVersionId");

-- CreateIndex
CREATE INDEX "ModelMetrics_timestamp_idx" ON "ModelMetrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ModelState_versionId_key" ON "ModelState"("versionId");

-- CreateIndex
CREATE INDEX "ModelState_modelType_idx" ON "ModelState"("modelType");

-- CreateIndex
CREATE INDEX "ModelState_createdAt_idx" ON "ModelState"("createdAt");

-- CreateIndex
CREATE INDEX "ModelState_isTrained_idx" ON "ModelState"("isTrained");

-- CreateIndex
CREATE INDEX "SearchEvent_sessionId_idx" ON "SearchEvent"("sessionId");

-- CreateIndex
CREATE INDEX "SearchEvent_timestamp_idx" ON "SearchEvent"("timestamp");

-- CreateIndex
CREATE INDEX "SearchEvent_searchType_idx" ON "SearchEvent"("searchType");

-- CreateIndex
CREATE INDEX "ABTestMetrics_testId_variantId_idx" ON "ABTestMetrics"("testId", "variantId");

-- CreateIndex
CREATE INDEX "ABTestMetrics_queryHash_idx" ON "ABTestMetrics"("queryHash");

-- CreateIndex
CREATE INDEX "Signal_type_idx" ON "Signal"("type");

-- CreateIndex
CREATE INDEX "Signal_source_idx" ON "Signal"("source");

-- CreateIndex
CREATE INDEX "Signal_processed_idx" ON "Signal"("processed");

-- CreateIndex
CREATE INDEX "Signal_timestamp_idx" ON "Signal"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsMetrics_timeWindow_idx" ON "AnalyticsMetrics"("timeWindow");

-- CreateIndex
CREATE INDEX "AnalyticsMetrics_timestamp_idx" ON "AnalyticsMetrics"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsMetrics_sessionId_idx" ON "AnalyticsMetrics"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsTrend_metric_idx" ON "AnalyticsTrend"("metric");

-- CreateIndex
CREATE INDEX "AnalyticsTrend_timestamp_idx" ON "AnalyticsTrend"("timestamp");

-- CreateIndex
CREATE INDEX "PerformanceInsight_type_idx" ON "PerformanceInsight"("type");

-- CreateIndex
CREATE INDEX "PerformanceInsight_severity_idx" ON "PerformanceInsight"("severity");

-- CreateIndex
CREATE INDEX "PerformanceInsight_timestamp_idx" ON "PerformanceInsight"("timestamp");

-- CreateIndex
CREATE INDEX "AnalyticsReport_timeWindow_idx" ON "AnalyticsReport"("timeWindow");

-- CreateIndex
CREATE INDEX "AnalyticsReport_timestamp_idx" ON "AnalyticsReport"("timestamp");

-- CreateIndex
CREATE INDEX "AdaptationSuggestion_queryHash_idx" ON "AdaptationSuggestion"("queryHash");

-- CreateIndex
CREATE INDEX "AdaptationSuggestion_status_idx" ON "AdaptationSuggestion"("status");

-- CreateIndex
CREATE INDEX "LearningMetric_type_idx" ON "LearningMetric"("type");

-- CreateIndex
CREATE INDEX "LearningMetric_timestamp_idx" ON "LearningMetric"("timestamp");

-- CreateIndex
CREATE INDEX "LearningMetric_sessionId_idx" ON "LearningMetric"("sessionId");

-- CreateIndex
CREATE INDEX "LearningMetric_modelId_idx" ON "LearningMetric"("modelId");

-- CreateIndex
CREATE INDEX "LearningMetric_timeframe_idx" ON "LearningMetric"("timeframe");

-- CreateIndex
CREATE INDEX "LearningEvent_type_idx" ON "LearningEvent"("type");

-- CreateIndex
CREATE INDEX "LearningEvent_status_idx" ON "LearningEvent"("status");

-- CreateIndex
CREATE INDEX "LearningEvent_priority_idx" ON "LearningEvent"("priority");

-- CreateIndex
CREATE INDEX "LearningEvent_timestamp_idx" ON "LearningEvent"("timestamp");

-- CreateIndex
CREATE INDEX "LearningEvent_correlationId_idx" ON "LearningEvent"("correlationId");

-- CreateIndex
CREATE INDEX "LearningEvent_sessionId_idx" ON "LearningEvent"("sessionId");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_idx" ON "LearningEvent"("userId");

-- CreateIndex
CREATE INDEX "LearningEvent_clientId_idx" ON "LearningEvent"("clientId");

-- CreateIndex
CREATE INDEX "LearningPattern_type_idx" ON "LearningPattern"("type");

-- CreateIndex
CREATE INDEX "LearningPattern_eventId_idx" ON "LearningPattern"("eventId");

-- CreateIndex
CREATE INDEX "EngineState_status_idx" ON "EngineState"("status");

-- CreateIndex
CREATE INDEX "EngineState_lastActive_idx" ON "EngineState"("lastActive");

-- CreateIndex
CREATE INDEX "EngineOperation_type_idx" ON "EngineOperation"("type");

-- CreateIndex
CREATE INDEX "EngineOperation_status_idx" ON "EngineOperation"("status");

-- CreateIndex
CREATE INDEX "EngineOperation_startTime_idx" ON "EngineOperation"("startTime");

-- CreateIndex
CREATE INDEX "EngineMetric_type_idx" ON "EngineMetric"("type");

-- CreateIndex
CREATE INDEX "EngineMetric_timestamp_idx" ON "EngineMetric"("timestamp");

-- CreateIndex
CREATE INDEX "EngineMetric_operationId_idx" ON "EngineMetric"("operationId");

-- CreateIndex
CREATE INDEX "EngineLearningResult_confidence_idx" ON "EngineLearningResult"("confidence");

-- CreateIndex
CREATE INDEX "EngineLearningResult_validatedAt_idx" ON "EngineLearningResult"("validatedAt");

-- CreateIndex
CREATE INDEX "EngineLearningResult_operationId_idx" ON "EngineLearningResult"("operationId");

-- CreateIndex
CREATE INDEX "EngineOptimizationStrategy_type_idx" ON "EngineOptimizationStrategy"("type");

-- CreateIndex
CREATE INDEX "EngineOptimizationStrategy_priority_idx" ON "EngineOptimizationStrategy"("priority");

-- CreateIndex
CREATE INDEX "EngineOptimizationStrategy_confidence_idx" ON "EngineOptimizationStrategy"("confidence");

-- CreateIndex
CREATE INDEX "EngineOptimizationStrategy_learningResultId_idx" ON "EngineOptimizationStrategy"("learningResultId");

-- CreateIndex
CREATE INDEX "EngineConfidenceScore_value_idx" ON "EngineConfidenceScore"("value");

-- CreateIndex
CREATE INDEX "EngineConfidenceScore_createdAt_idx" ON "EngineConfidenceScore"("createdAt");

-- CreateIndex
CREATE INDEX "SearchWeights_active_idx" ON "SearchWeights"("active");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConfig_key_key" ON "SearchConfig"("key");

-- CreateIndex
CREATE INDEX "SearchConfig_key_idx" ON "SearchConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentConfig_key_key" ON "ExperimentConfig"("key");

-- CreateIndex
CREATE INDEX "EngineRecommendation_type_idx" ON "EngineRecommendation"("type");

-- CreateIndex
CREATE INDEX "EngineRecommendation_priority_idx" ON "EngineRecommendation"("priority");

-- CreateIndex
CREATE INDEX "EngineRecommendation_confidence_idx" ON "EngineRecommendation"("confidence");

-- CreateIndex
CREATE INDEX "EngineRecommendation_learningResultId_idx" ON "EngineRecommendation"("learningResultId");

-- CreateIndex
CREATE UNIQUE INDEX "indices_name_key" ON "indices"("name");

-- CreateIndex
CREATE INDEX "indices_name_idx" ON "indices"("name");

-- CreateIndex
CREATE INDEX "indices_status_idx" ON "indices"("status");

-- CreateIndex
CREATE INDEX "indices_health_idx" ON "indices"("health");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_clientId_idx" ON "ApiKey"("clientId");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE INDEX "ApiKey_expiresAt_idx" ON "ApiKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminToken_token_key" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_token_idx" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_isActive_idx" ON "AdminToken"("isActive");

-- CreateIndex
CREATE INDEX "_SessionToSignal_B_index" ON "_SessionToSignal"("B");

-- CreateIndex
CREATE UNIQUE INDEX "registry_entries_name_key" ON "registry_entries"("name");

-- CreateIndex
CREATE INDEX "registry_entries_type_idx" ON "registry_entries"("type");

-- CreateIndex
CREATE INDEX "registry_entries_status_idx" ON "registry_entries"("status");

-- CreateIndex
CREATE INDEX "registry_entries_name_idx" ON "registry_entries"("name");

-- CreateIndex
CREATE INDEX "registry_metadata_entryId_idx" ON "registry_metadata"("entryId");

-- CreateIndex
CREATE INDEX "registry_metadata_namespace_idx" ON "registry_metadata"("namespace");

-- CreateIndex
CREATE INDEX "registry_metadata_key_idx" ON "registry_metadata"("key");

-- CreateIndex
CREATE UNIQUE INDEX "registry_metadata_namespace_key_key" ON "registry_metadata"("namespace", "key");

-- CreateIndex
CREATE INDEX "_ModelMetricsToModelState_B_index" ON "_ModelMetricsToModelState"("B");

-- CreateIndex
CREATE INDEX "_SearchEventToSearchFeedback_B_index" ON "_SearchEventToSearchFeedback"("B");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestAssignment" ADD CONSTRAINT "ABTestAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestAssignment" ADD CONSTRAINT "ABTestAssignment_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetric" ADD CONSTRAINT "ABTestMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetric" ADD CONSTRAINT "ABTestMetric_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaseEvent" ADD CONSTRAINT "BaseEvent_searchEventid_fkey" FOREIGN KEY ("searchEventid") REFERENCES "SearchEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelEvent" ADD CONSTRAINT "ModelEvent_baseEventId_fkey" FOREIGN KEY ("baseEventId") REFERENCES "BaseEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedSignal" ADD CONSTRAINT "ProcessedSignal_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelVersion" ADD CONSTRAINT "ModelVersion_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchEvent" ADD CONSTRAINT "SearchEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetrics" ADD CONSTRAINT "ABTestMetrics_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsMetrics" ADD CONSTRAINT "AnalyticsMetrics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMetric" ADD CONSTRAINT "LearningMetric_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMetric" ADD CONSTRAINT "LearningMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPattern" ADD CONSTRAINT "LearningPattern_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LearningEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineLearningResult" ADD CONSTRAINT "EngineLearningResult_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "EngineOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineOptimizationStrategy" ADD CONSTRAINT "EngineOptimizationStrategy_learningResultId_fkey" FOREIGN KEY ("learningResultId") REFERENCES "EngineLearningResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineRecommendation" ADD CONSTRAINT "EngineRecommendation_learningResultId_fkey" FOREIGN KEY ("learningResultId") REFERENCES "EngineLearningResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionToSignal" ADD CONSTRAINT "_SessionToSignal_A_fkey" FOREIGN KEY ("A") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionToSignal" ADD CONSTRAINT "_SessionToSignal_B_fkey" FOREIGN KEY ("B") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelMetricsToModelState" ADD CONSTRAINT "_ModelMetricsToModelState_A_fkey" FOREIGN KEY ("A") REFERENCES "ModelMetrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelMetricsToModelState" ADD CONSTRAINT "_ModelMetricsToModelState_B_fkey" FOREIGN KEY ("B") REFERENCES "ModelState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SearchEventToSearchFeedback" ADD CONSTRAINT "_SearchEventToSearchFeedback_A_fkey" FOREIGN KEY ("A") REFERENCES "SearchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SearchEventToSearchFeedback" ADD CONSTRAINT "_SearchEventToSearchFeedback_B_fkey" FOREIGN KEY ("B") REFERENCES "SearchFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
