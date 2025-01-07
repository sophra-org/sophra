/*
  Warnings:

  - You are about to drop the `learning_metrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "learning_metrics" DROP CONSTRAINT "learning_metrics_modelId_fkey";

-- DropForeignKey
ALTER TABLE "learning_metrics" DROP CONSTRAINT "learning_metrics_sessionId_fkey";

-- DropTable
DROP TABLE "learning_metrics";

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

-- AddForeignKey
ALTER TABLE "LearningMetric" ADD CONSTRAINT "LearningMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMetric" ADD CONSTRAINT "LearningMetric_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "model_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
