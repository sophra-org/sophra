/*
  Warnings:

  - You are about to drop the column `metadata` on the `ABTestAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `ABTestMetric` table. All the data in the column will be lost.
  - You are about to drop the `_ABTestAssignmentToSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[testId,sessionId]` on the table `ABTestAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `ABTestMetric` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ABTestAssignmentToSession" DROP CONSTRAINT "_ABTestAssignmentToSession_A_fkey";

-- DropForeignKey
ALTER TABLE "_ABTestAssignmentToSession" DROP CONSTRAINT "_ABTestAssignmentToSession_B_fkey";

-- DropIndex
DROP INDEX "ABTest_status_startDate_endDate_idx";

-- DropIndex
DROP INDEX "ABTestAssignment_sessionId_idx";

-- DropIndex
DROP INDEX "ABTestAssignment_testId_sessionId_idx";

-- DropIndex
DROP INDEX "ABTestMetric_eventType_idx";

-- AlterTable
ALTER TABLE "ABTest" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ABTestAssignment" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "ABTestMetric" ADD COLUMN "sessionId" TEXT;

-- DropTable
DROP TABLE "_ABTestAssignmentToSession";

-- CreateIndex
CREATE UNIQUE INDEX "ABTestAssignment_testId_sessionId_key" ON "ABTestAssignment"("testId", "sessionId");

-- CreateIndex
CREATE INDEX "ABTestMetric_sessionId_idx" ON "ABTestMetric"("sessionId");

-- AddForeignKey
ALTER TABLE "ABTestAssignment" ADD CONSTRAINT "ABTestAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestMetric" ADD CONSTRAINT "ABTestMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Then make it required
ALTER TABLE "ABTestMetric" ALTER COLUMN "sessionId" SET NOT NULL;
