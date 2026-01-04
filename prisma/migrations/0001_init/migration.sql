-- CreateEnum
CREATE TYPE "CrawlMode" AS ENUM ('STATIC', 'PLAYWRIGHT');
CREATE TYPE "AdType" AS ENUM ('IFRAME', 'SCRIPT', 'IMAGE', 'SPONSORED_LABEL', 'OUTBOUND_LINK');
CREATE TYPE "CrawlStatus" AS ENUM ('OK', 'FAIL', 'SKIP');
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'OK', 'FAIL');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'QUALIFIED', 'CONTACTED', 'IGNORE');

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "crawlMode" "CrawlMode" NOT NULL DEFAULT 'STATIC',
    "seeds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sitemapUrl" TEXT,
    "rssUrl" TEXT,
    "includePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxPagesPerRun" INTEGER NOT NULL DEFAULT 50,
    "crawlDelayMsMin" INTEGER NOT NULL DEFAULT 2000,
    "crawlDelayMsMax" INTEGER NOT NULL DEFAULT 5000,
    "userAgent" TEXT NOT NULL DEFAULT 'ArmanetAdPoacher/1.0',
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lastFetchedAt" TIMESTAMP(3),
    "lastStatusCode" INTEGER,
    "contentHash" TEXT,
    "fetchDurationMs" INTEGER,
    "errorText" TEXT,
    CONSTRAINT "Page_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Page_sourceId_url_key" ON "Page"("sourceId", "url");

CREATE TABLE "AdObservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adType" "AdType" NOT NULL,
    "rawHtmlSnippet" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "screenshotPath" TEXT,
    "extractedClickUrl" TEXT,
    "extractedDestDomain" TEXT,
    "extractedBrandText" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "signature" TEXT NOT NULL,
    CONSTRAINT "AdObservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AdObservation_sourceId_signature_key" ON "AdObservation"("sourceId", "signature");
CREATE INDEX "AdObservation_extractedDestDomain_idx" ON "AdObservation"("extractedDestDomain");

CREATE TABLE "Advertiser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "primaryDomain" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL UNIQUE,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "sightings7d" INTEGER NOT NULL,
    "uniquePublishers7d" INTEGER NOT NULL,
    "avgConfidenceTop5" DOUBLE PRECISION NOT NULL,
    "topEvidence" JSONB NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    CONSTRAINT "Lead_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "Advertiser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CrawlLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "CrawlStatus" NOT NULL,
    "statusCode" INTEGER,
    "errorClass" TEXT,
    "errorText" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CrawlLog_sourceId_createdAt_idx" ON "CrawlLog"("sourceId", "createdAt");

CREATE TABLE "JobRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobName" TEXT NOT NULL,
    "sourceId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL,
    "stats" JSONB NOT NULL,
    CONSTRAINT "JobRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "JobRun_jobName_startedAt_idx" ON "JobRun"("jobName", "startedAt");
