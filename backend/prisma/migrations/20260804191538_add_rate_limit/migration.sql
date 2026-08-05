-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCount" INTEGER NOT NULL DEFAULT 0,
    "dailyReset" TIMESTAMP(3) NOT NULL,
    "burstCount" INTEGER NOT NULL DEFAULT 0,
    "burstReset" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_userId_key" ON "RateLimit"("userId");
