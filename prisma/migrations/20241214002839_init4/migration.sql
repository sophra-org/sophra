/*
  Warnings:

  - You are about to drop the `model_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LearningEventType" AS ENUM ('SEARCH_PATTERN', 'USER_FEEDBACK', 'MODEL_UPDATE', 'ADAPTATION_RULE', 'SIGNAL_DETECTED', 'METRIC_THRESHOLD', 'SYSTEM_STATE', 'EXPERIMENT_RESULT');

-- CreateEnum
CREATE TYPE "LearningEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "LearningEventPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- DropForeignKey
ALTER TABLE "LearningMetric" DROP CONSTRAINT "LearningMetric_modelId_fkey";

-- DropForeignKey
ALTER TABLE "ModelVersion" DROP CONSTRAINT "ModelVersion_configId_fkey";

-- DropTable
DROP TABLE "model_configs";

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

-- CreateIndex
CREATE INDEX "ModelConfig_type_idx" ON "ModelConfig"("type");

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

-- AddForeignKey
ALTER TABLE "ModelVersion" ADD CONSTRAINT "ModelVersion_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMetric" ADD CONSTRAINT "LearningMetric_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ModelConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPattern" ADD CONSTRAINT "LearningPattern_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LearningEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
