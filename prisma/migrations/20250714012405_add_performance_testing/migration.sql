-- CreateTable
CREATE TABLE "PerformanceTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "appId" TEXT,
    "appName" TEXT,
    "testStoreUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "baselineScore" REAL,
    "postInstallScore" REAL,
    "scoreDelta" REAL,
    "passStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PerformanceTestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performanceTestId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "lighthouseScore" REAL NOT NULL,
    "lighthouseReport" TEXT,
    "testUrl" TEXT NOT NULL,
    "userAgent" TEXT,
    "testDuration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceTestResult_performanceTestId_fkey" FOREIGN KEY ("performanceTestId") REFERENCES "PerformanceTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PerformanceTestResult_performanceTestId_testType_idx" ON "PerformanceTestResult"("performanceTestId", "testType");
