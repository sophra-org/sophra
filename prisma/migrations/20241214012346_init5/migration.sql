-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('IMPRESSION', 'VIEW', 'CLICK', 'CONVERSION');

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

-- CreateIndex
CREATE INDEX "AdaptationSuggestion_queryHash_idx" ON "AdaptationSuggestion"("queryHash");

-- CreateIndex
CREATE INDEX "AdaptationSuggestion_status_idx" ON "AdaptationSuggestion"("status");
