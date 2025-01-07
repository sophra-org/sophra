/*
  Warnings:

  - Added the required column `strength` to the `Signal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EngineOptimizationType" AS ENUM ('WEIGHT_ADJUSTMENT', 'QUERY_TRANSFORMATION', 'INDEX_OPTIMIZATION', 'CACHE_STRATEGY');

-- CreateEnum
CREATE TYPE "EngineRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EngineOperationType" AS ENUM ('PATTERN_DETECTION', 'STRATEGY_EXECUTION', 'RULE_EVALUATION', 'ADAPTATION', 'LEARNING_CYCLE');

-- CreateEnum
CREATE TYPE "EngineOperationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LearningEventType" ADD VALUE 'PATTERN_DETECTION';
ALTER TYPE "LearningEventType" ADD VALUE 'STRATEGY_GENERATION';
ALTER TYPE "LearningEventType" ADD VALUE 'FEEDBACK_ANALYSIS';
ALTER TYPE "LearningEventType" ADD VALUE 'MODEL_TRAINING';
ALTER TYPE "LearningEventType" ADD VALUE 'SYSTEM_ADAPTATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MetricType" ADD VALUE 'CACHE_EFFICIENCY';
ALTER TYPE "MetricType" ADD VALUE 'CACHE_HIT_RATE';
ALTER TYPE "MetricType" ADD VALUE 'REDIS_GET';
ALTER TYPE "MetricType" ADD VALUE 'REDIS_SET';
ALTER TYPE "MetricType" ADD VALUE 'REDIS_DELETE';
ALTER TYPE "MetricType" ADD VALUE 'REDIS_EXISTS';
ALTER TYPE "MetricType" ADD VALUE 'REDIS_ERROR';
ALTER TYPE "MetricType" ADD VALUE 'ERROR_RATE';
ALTER TYPE "MetricType" ADD VALUE 'THROUGHPUT';
ALTER TYPE "MetricType" ADD VALUE 'CPU_USAGE';
ALTER TYPE "MetricType" ADD VALUE 'MEMORY_USAGE';

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "strength" DOUBLE PRECISION NOT NULL;

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

-- AddForeignKey
ALTER TABLE "EngineLearningResult" ADD CONSTRAINT "EngineLearningResult_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "EngineOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineOptimizationStrategy" ADD CONSTRAINT "EngineOptimizationStrategy_learningResultId_fkey" FOREIGN KEY ("learningResultId") REFERENCES "EngineLearningResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineRecommendation" ADD CONSTRAINT "EngineRecommendation_learningResultId_fkey" FOREIGN KEY ("learningResultId") REFERENCES "EngineLearningResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
