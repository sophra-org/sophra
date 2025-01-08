/*
  Warnings:

  - You are about to drop the `ABTest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ABTestAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ABTestMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ABTestMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdaptationRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdaptationSuggestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdminToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnalyticsMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnalyticsReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AnalyticsTrend` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuthSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BaseEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineConfidenceScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineLearningResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineOperation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineOptimizationStrategy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineRecommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EngineState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExperimentConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearningEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearningMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearningPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LearningRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelMetrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModelVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PerformanceInsight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessedSignal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SearchWeights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Signal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SignalBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SignalPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ModelMetricsToModelState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SearchEventToSearchFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SessionToSignal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `indices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `migrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TestHealthScore" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FixType" AS ENUM ('ASSERTION', 'SETUP', 'TEARDOWN', 'ASYNC', 'MOCK', 'TIMING', 'DEPENDENCY', 'LOGIC', 'OTHER');

-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('COVERAGE_GAP', 'ENHANCEMENT', 'REGRESSION', 'EDGE_CASE');

-- DropForeignKey
ALTER TABLE "ABTestAssignment" DROP CONSTRAINT "ABTestAssignment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ABTestAssignment" DROP CONSTRAINT "ABTestAssignment_testId_fkey";

-- DropForeignKey
ALTER TABLE "ABTestMetric" DROP CONSTRAINT "ABTestMetric_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ABTestMetric" DROP CONSTRAINT "ABTestMetric_testId_fkey";

-- DropForeignKey
ALTER TABLE "ABTestMetrics" DROP CONSTRAINT "ABTestMetrics_testId_fkey";

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "AnalyticsMetrics" DROP CONSTRAINT "AnalyticsMetrics_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "AuthSession" DROP CONSTRAINT "AuthSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "BaseEvent" DROP CONSTRAINT "BaseEvent_searchEventid_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "EngineLearningResult" DROP CONSTRAINT "EngineLearningResult_operationId_fkey";

-- DropForeignKey
ALTER TABLE "EngineOptimizationStrategy" DROP CONSTRAINT "EngineOptimizationStrategy_learningResultId_fkey";

-- DropForeignKey
ALTER TABLE "EngineRecommendation" DROP CONSTRAINT "EngineRecommendation_learningResultId_fkey";

-- DropForeignKey
ALTER TABLE "LearningMetric" DROP CONSTRAINT "LearningMetric_modelId_fkey";

-- DropForeignKey
ALTER TABLE "LearningMetric" DROP CONSTRAINT "LearningMetric_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "LearningPattern" DROP CONSTRAINT "LearningPattern_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ModelEvent" DROP CONSTRAINT "ModelEvent_baseEventId_fkey";

-- DropForeignKey
ALTER TABLE "ModelVersion" DROP CONSTRAINT "ModelVersion_configId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessedSignal" DROP CONSTRAINT "ProcessedSignal_signalId_fkey";

-- DropForeignKey
ALTER TABLE "SearchEvent" DROP CONSTRAINT "SearchEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "_ModelMetricsToModelState" DROP CONSTRAINT "_ModelMetricsToModelState_A_fkey";

-- DropForeignKey
ALTER TABLE "_ModelMetricsToModelState" DROP CONSTRAINT "_ModelMetricsToModelState_B_fkey";

-- DropForeignKey
ALTER TABLE "_SearchEventToSearchFeedback" DROP CONSTRAINT "_SearchEventToSearchFeedback_A_fkey";

-- DropForeignKey
ALTER TABLE "_SearchEventToSearchFeedback" DROP CONSTRAINT "_SearchEventToSearchFeedback_B_fkey";

-- DropForeignKey
ALTER TABLE "_SessionToSignal" DROP CONSTRAINT "_SessionToSignal_A_fkey";

-- DropForeignKey
ALTER TABLE "_SessionToSignal" DROP CONSTRAINT "_SessionToSignal_B_fkey";

-- DropTable
DROP TABLE "ABTest";

-- DropTable
DROP TABLE "ABTestAssignment";

-- DropTable
DROP TABLE "ABTestMetric";

-- DropTable
DROP TABLE "ABTestMetrics";

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "AdaptationRule";

-- DropTable
DROP TABLE "AdaptationSuggestion";

-- DropTable
DROP TABLE "AdminToken";

-- DropTable
DROP TABLE "AnalyticsMetrics";

-- DropTable
DROP TABLE "AnalyticsReport";

-- DropTable
DROP TABLE "AnalyticsTrend";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "AuthSession";

-- DropTable
DROP TABLE "BaseEvent";

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "EngineConfidenceScore";

-- DropTable
DROP TABLE "EngineLearningResult";

-- DropTable
DROP TABLE "EngineMetric";

-- DropTable
DROP TABLE "EngineOperation";

-- DropTable
DROP TABLE "EngineOptimizationStrategy";

-- DropTable
DROP TABLE "EngineRecommendation";

-- DropTable
DROP TABLE "EngineState";

-- DropTable
DROP TABLE "ExperimentConfig";

-- DropTable
DROP TABLE "FeedbackRequest";

-- DropTable
DROP TABLE "LearningEvent";

-- DropTable
DROP TABLE "LearningMetric";

-- DropTable
DROP TABLE "LearningPattern";

-- DropTable
DROP TABLE "LearningRequest";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "ModelConfig";

-- DropTable
DROP TABLE "ModelEvent";

-- DropTable
DROP TABLE "ModelMetrics";

-- DropTable
DROP TABLE "ModelState";

-- DropTable
DROP TABLE "ModelVersion";

-- DropTable
DROP TABLE "PerformanceInsight";

-- DropTable
DROP TABLE "ProcessedSignal";

-- DropTable
DROP TABLE "SearchAnalytics";

-- DropTable
DROP TABLE "SearchConfig";

-- DropTable
DROP TABLE "SearchEvent";

-- DropTable
DROP TABLE "SearchFeedback";

-- DropTable
DROP TABLE "SearchWeights";

-- DropTable
DROP TABLE "Signal";

-- DropTable
DROP TABLE "SignalBatch";

-- DropTable
DROP TABLE "SignalPattern";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "_ModelMetricsToModelState";

-- DropTable
DROP TABLE "_SearchEventToSearchFeedback";

-- DropTable
DROP TABLE "_SessionToSignal";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "indices";

-- DropTable
DROP TABLE "migrations";

-- DropTable
DROP TABLE "sessions";

-- DropEnum
DROP TYPE "EngagementType";

-- DropEnum
DROP TYPE "EngineOperationStatus";

-- DropEnum
DROP TYPE "EngineOperationType";

-- DropEnum
DROP TYPE "EngineOptimizationType";

-- DropEnum
DROP TYPE "EngineRiskLevel";

-- DropEnum
DROP TYPE "EventType";

-- DropEnum
DROP TYPE "ExperimentStatus";

-- DropEnum
DROP TYPE "LearningEventPriority";

-- DropEnum
DROP TYPE "LearningEventStatus";

-- DropEnum
DROP TYPE "LearningEventType";

-- DropEnum
DROP TYPE "MetricType";

-- DropEnum
DROP TYPE "ModelType";

-- DropEnum
DROP TYPE "RulePriority";

-- DropEnum
DROP TYPE "Severity";

-- DropEnum
DROP TYPE "SignalType";

-- CreateTable
CREATE TABLE "TestFile" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "avgPassRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentPassRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFixes" INTEGER NOT NULL DEFAULT 0,
    "flakyTests" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "healthScore" "TestHealthScore" NOT NULL DEFAULT 'GOOD',
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "criticalTests" INTEGER NOT NULL DEFAULT 0,
    "lastFailureReason" TEXT,

    CONSTRAINT "TestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestExecution" (
    "id" TEXT NOT NULL,
    "testFileId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passed" BOOLEAN NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "errorMessage" TEXT,
    "testResults" JSONB NOT NULL,
    "environment" TEXT NOT NULL,
    "commitHash" TEXT,
    "performance" JSONB,

    CONSTRAINT "TestExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCoverage" (
    "id" TEXT NOT NULL,
    "testFileId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coveragePercent" DOUBLE PRECISION NOT NULL,
    "linesCovered" JSONB NOT NULL,
    "linesUncovered" JSONB NOT NULL,
    "branchCoverage" JSONB,
    "functionCoverage" JSONB,
    "suggestedAreas" JSONB,
    "coverageType" TEXT NOT NULL,

    CONSTRAINT "TestCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestFix" (
    "id" TEXT NOT NULL,
    "testFileId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fixType" "FixType" NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "beforeState" JSONB NOT NULL,
    "afterState" JSONB NOT NULL,
    "patternUsed" TEXT,
    "impactScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TestFix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestGeneration" (
    "id" TEXT NOT NULL,
    "testFileId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationType" "GenerationType" NOT NULL,
    "newTests" JSONB NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "targetArea" TEXT NOT NULL,
    "coverageImprovement" DOUBLE PRECISION NOT NULL,
    "generationStrategy" TEXT NOT NULL,
    "context" JSONB NOT NULL,

    CONSTRAINT "TestGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestFile_filePath_key" ON "TestFile"("filePath");

-- CreateIndex
CREATE INDEX "TestFile_healthScore_idx" ON "TestFile"("healthScore");

-- CreateIndex
CREATE INDEX "TestFile_currentPassRate_idx" ON "TestFile"("currentPassRate");

-- CreateIndex
CREATE INDEX "TestFile_currentCoverage_idx" ON "TestFile"("currentCoverage");

-- CreateIndex
CREATE INDEX "TestExecution_testFileId_executedAt_idx" ON "TestExecution"("testFileId", "executedAt");

-- CreateIndex
CREATE INDEX "TestExecution_passed_idx" ON "TestExecution"("passed");

-- CreateIndex
CREATE INDEX "TestCoverage_testFileId_measuredAt_idx" ON "TestCoverage"("testFileId", "measuredAt");

-- CreateIndex
CREATE INDEX "TestCoverage_coveragePercent_idx" ON "TestCoverage"("coveragePercent");

-- CreateIndex
CREATE INDEX "TestFix_testFileId_appliedAt_idx" ON "TestFix"("testFileId", "appliedAt");

-- CreateIndex
CREATE INDEX "TestFix_successful_idx" ON "TestFix"("successful");

-- CreateIndex
CREATE INDEX "TestFix_fixType_idx" ON "TestFix"("fixType");

-- CreateIndex
CREATE INDEX "TestGeneration_testFileId_generatedAt_idx" ON "TestGeneration"("testFileId", "generatedAt");

-- CreateIndex
CREATE INDEX "TestGeneration_accepted_idx" ON "TestGeneration"("accepted");

-- CreateIndex
CREATE INDEX "TestGeneration_generationType_idx" ON "TestGeneration"("generationType");

-- AddForeignKey
ALTER TABLE "TestExecution" ADD CONSTRAINT "TestExecution_testFileId_fkey" FOREIGN KEY ("testFileId") REFERENCES "TestFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCoverage" ADD CONSTRAINT "TestCoverage_testFileId_fkey" FOREIGN KEY ("testFileId") REFERENCES "TestFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestFix" ADD CONSTRAINT "TestFix_testFileId_fkey" FOREIGN KEY ("testFileId") REFERENCES "TestFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestGeneration" ADD CONSTRAINT "TestGeneration_testFileId_fkey" FOREIGN KEY ("testFileId") REFERENCES "TestFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
