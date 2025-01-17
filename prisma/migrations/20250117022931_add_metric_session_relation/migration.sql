-- DropIndex
DROP INDEX "ABTestMetric_testId_variantId_idx";

-- DropIndex
DROP INDEX "ABTestMetric_timestamp_idx";

-- CreateIndex
CREATE INDEX "ABTestMetric_testId_idx" ON "ABTestMetric"("testId");

-- CreateIndex
CREATE INDEX "ABTestMetric_variantId_idx" ON "ABTestMetric"("variantId");
