-- CreateTable
CREATE TABLE "AdminToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminToken_token_key" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_token_idx" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_isActive_idx" ON "AdminToken"("isActive");
