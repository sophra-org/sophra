/*
  Warnings:

  - You are about to drop the `AnalysisSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FixPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestAnalysis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestCoverage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestExecution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestFix` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestGeneration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestPattern` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AnalysisSessionToTestFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TestAnalysis" DROP CONSTRAINT "TestAnalysis_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "TestAnalysis" DROP CONSTRAINT "TestAnalysis_testFileId_fkey";

-- DropForeignKey
ALTER TABLE "TestCoverage" DROP CONSTRAINT "TestCoverage_testFileId_fkey";

-- DropForeignKey
ALTER TABLE "TestExecution" DROP CONSTRAINT "TestExecution_testFileId_fkey";

-- DropForeignKey
ALTER TABLE "TestFix" DROP CONSTRAINT "TestFix_testFileId_fkey";

-- DropForeignKey
ALTER TABLE "TestGeneration" DROP CONSTRAINT "TestGeneration_testFileId_fkey";

-- DropForeignKey
ALTER TABLE "_AnalysisSessionToTestFile" DROP CONSTRAINT "_AnalysisSessionToTestFile_A_fkey";

-- DropForeignKey
ALTER TABLE "_AnalysisSessionToTestFile" DROP CONSTRAINT "_AnalysisSessionToTestFile_B_fkey";

-- DropTable
DROP TABLE "AnalysisSession";

-- DropTable
DROP TABLE "FixPattern";

-- DropTable
DROP TABLE "TestAnalysis";

-- DropTable
DROP TABLE "TestCoverage";

-- DropTable
DROP TABLE "TestExecution";

-- DropTable
DROP TABLE "TestFile";

-- DropTable
DROP TABLE "TestFix";

-- DropTable
DROP TABLE "TestGeneration";

-- DropTable
DROP TABLE "TestPattern";

-- DropTable
DROP TABLE "_AnalysisSessionToTestFile";

-- DropEnum
DROP TYPE "FixType";

-- DropEnum
DROP TYPE "GenerationType";

-- DropEnum
DROP TYPE "PatternType";

-- DropEnum
DROP TYPE "SessionStatus";

-- DropEnum
DROP TYPE "TestHealthScore";

-- CreateTable
CREATE TABLE "CodebaseFile" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "versionId" TEXT NOT NULL,
    "directoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodebaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodebaseDirectory" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodebaseDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodebaseVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "CodebaseVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseFile_path_key" ON "CodebaseFile"("path");

-- CreateIndex
CREATE INDEX "CodebaseFile_path_idx" ON "CodebaseFile"("path");

-- CreateIndex
CREATE INDEX "CodebaseFile_hash_idx" ON "CodebaseFile"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseDirectory_path_key" ON "CodebaseDirectory"("path");

-- CreateIndex
CREATE INDEX "CodebaseDirectory_path_idx" ON "CodebaseDirectory"("path");

-- CreateIndex
CREATE INDEX "CodebaseVersion_version_idx" ON "CodebaseVersion"("version");

-- AddForeignKey
ALTER TABLE "CodebaseFile" ADD CONSTRAINT "CodebaseFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CodebaseVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodebaseFile" ADD CONSTRAINT "CodebaseFile_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "CodebaseDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodebaseDirectory" ADD CONSTRAINT "CodebaseDirectory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CodebaseDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
