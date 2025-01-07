-- AlterTable
ALTER TABLE "_ABTestAssignmentToSession" ADD CONSTRAINT "_ABTestAssignmentToSession_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ABTestAssignmentToSession_AB_unique";

-- AlterTable
ALTER TABLE "_ModelMetricsToModelState" ADD CONSTRAINT "_ModelMetricsToModelState_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ModelMetricsToModelState_AB_unique";

-- AlterTable
ALTER TABLE "_SearchEventToSearchFeedback" ADD CONSTRAINT "_SearchEventToSearchFeedback_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SearchEventToSearchFeedback_AB_unique";

-- AlterTable
ALTER TABLE "_SessionToSignal" ADD CONSTRAINT "_SessionToSignal_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SessionToSignal_AB_unique";
