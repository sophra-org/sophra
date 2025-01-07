/*
  Warnings:

  - The primary key for the `_ABTestAssignmentToSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_ModelMetricsToModelState` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_SearchEventToSearchFeedback` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_SessionToSignal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ABTestAssignmentToSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_ModelMetricsToModelState` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_SearchEventToSearchFeedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_SessionToSignal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_ABTestAssignmentToSession" DROP CONSTRAINT "_ABTestAssignmentToSession_AB_pkey";

-- AlterTable
ALTER TABLE "_ModelMetricsToModelState" DROP CONSTRAINT "_ModelMetricsToModelState_AB_pkey";

-- AlterTable
ALTER TABLE "_SearchEventToSearchFeedback" DROP CONSTRAINT "_SearchEventToSearchFeedback_AB_pkey";

-- AlterTable
ALTER TABLE "_SessionToSignal" DROP CONSTRAINT "_SessionToSignal_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_ABTestAssignmentToSession_AB_unique" ON "_ABTestAssignmentToSession"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_ModelMetricsToModelState_AB_unique" ON "_ModelMetricsToModelState"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_SearchEventToSearchFeedback_AB_unique" ON "_SearchEventToSearchFeedback"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_SessionToSignal_AB_unique" ON "_SessionToSignal"("A", "B");
