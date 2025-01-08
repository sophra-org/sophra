-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('TEST_STRUCTURE', 'ASSERTION_STYLE', 'MOCK_USAGE', 'SETUP_PATTERN', 'ERROR_HANDLING', 'ASYNC_PATTERN');

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" JSONB,
    "decisions" JSONB[],
    "operations" JSONB[],

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAnalysis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "testFileId" TEXT NOT NULL,
    "patterns" JSONB NOT NULL,
    "antiPatterns" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPattern" (
    "id" TEXT NOT NULL,
    "type" "PatternType" NOT NULL,
    "pattern" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixPattern" (
    "id" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AnalysisSessionToTestFile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "AnalysisSession_status_idx" ON "AnalysisSession"("status");

-- CreateIndex
CREATE INDEX "AnalysisSession_startedAt_idx" ON "AnalysisSession"("startedAt");

-- CreateIndex
CREATE INDEX "TestAnalysis_sessionId_idx" ON "TestAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "TestAnalysis_testFileId_idx" ON "TestAnalysis"("testFileId");

-- CreateIndex
CREATE INDEX "TestAnalysis_timestamp_idx" ON "TestAnalysis"("timestamp");

-- CreateIndex
CREATE INDEX "TestPattern_type_idx" ON "TestPattern"("type");

-- CreateIndex
CREATE INDEX "TestPattern_successRate_idx" ON "TestPattern"("successRate");

-- CreateIndex
CREATE INDEX "TestPattern_usageCount_idx" ON "TestPattern"("usageCount");

-- CreateIndex
CREATE INDEX "FixPattern_successRate_idx" ON "FixPattern"("successRate");

-- CreateIndex
CREATE INDEX "FixPattern_usageCount_idx" ON "FixPattern"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "_AnalysisSessionToTestFile_AB_unique" ON "_AnalysisSessionToTestFile"("A", "B");

-- CreateIndex
CREATE INDEX "_AnalysisSessionToTestFile_B_index" ON "_AnalysisSessionToTestFile"("B");

-- AddForeignKey
ALTER TABLE "TestAnalysis" ADD CONSTRAINT "TestAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAnalysis" ADD CONSTRAINT "TestAnalysis_testFileId_fkey" FOREIGN KEY ("testFileId") REFERENCES "TestFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisSessionToTestFile" ADD CONSTRAINT "_AnalysisSessionToTestFile_A_fkey" FOREIGN KEY ("A") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnalysisSessionToTestFile" ADD CONSTRAINT "_AnalysisSessionToTestFile_B_fkey" FOREIGN KEY ("B") REFERENCES "TestFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
