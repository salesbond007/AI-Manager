-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "alertFailureThreshold" INTEGER,
ADD COLUMN     "alertStaleHours" INTEGER,
ADD COLUMN     "controlWebhookUrl" TEXT,
ADD COLUMN     "docUrl" TEXT,
ADD COLUMN     "monthlyBudgetJpy" INTEGER,
ADD COLUMN     "monthlyFixedCostJpy" INTEGER,
ADD COLUMN     "runbookText" TEXT;

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "usageCostJpy" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReview" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "reviewedById" TEXT,
    "riskScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostEntry_toolId_yearMonth_idx" ON "CostEntry"("toolId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "CostEntry_toolId_yearMonth_key" ON "CostEntry"("toolId", "yearMonth");

-- CreateIndex
CREATE INDEX "MonthlyReview_toolId_yearMonth_idx" ON "MonthlyReview"("toolId", "yearMonth");

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReview" ADD CONSTRAINT "MonthlyReview_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReview" ADD CONSTRAINT "MonthlyReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
