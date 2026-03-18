-- AlterEnum
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'linkedin_profile_linked';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'profile_match_confirmed';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'employment_snapshot_refreshed';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'employment_title_changed';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'employment_company_changed';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'champion_moved_companies';

-- CreateEnum
CREATE TYPE "ExternalProfileProvider" AS ENUM (
  'linkedin',
  'manual',
  'third_party',
  'internal_ai'
);

-- CreateEnum
CREATE TYPE "ProfileSourceType" AS ENUM (
  'official_linkedin',
  'user_provided',
  'third_party_enrichment',
  'ai_inference'
);

-- CreateEnum
CREATE TYPE "LinkedInProfileLinkStatus" AS ENUM (
  'active',
  'unresolved',
  'broken',
  'stale'
);

-- CreateEnum
CREATE TYPE "ProfileMatchStatus" AS ENUM (
  'suggested',
  'confirmed',
  'rejected'
);

-- CreateEnum
CREATE TYPE "EmploymentChangeType" AS ENUM (
  'title_changed',
  'company_changed',
  'departed_prior_employer',
  'stale_profile_data',
  'broken_profile_link'
);

-- CreateEnum
CREATE TYPE "RelationshipStage" AS ENUM (
  'current',
  'historical',
  'champion',
  'former_champion'
);

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('open', 'dismissed', 'resolved');

-- CreateEnum
CREATE TYPE "WatchlistPriority" AS ENUM ('normal', 'high', 'critical');

-- CreateTable
CREATE TABLE "ExternalProfileSource" (
  "id" TEXT NOT NULL,
  "provider" "ExternalProfileProvider" NOT NULL,
  "sourceType" "ProfileSourceType" NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "isOfficial" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalProfileSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedInProfileLink" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "externalProfileSourceId" TEXT,
  "profileUrl" TEXT NOT NULL,
  "normalizedProfileUrl" TEXT NOT NULL,
  "memberId" TEXT,
  "publicIdentifier" TEXT,
  "headline" TEXT,
  "location" TEXT,
  "sourceType" "ProfileSourceType" NOT NULL,
  "status" "LinkedInProfileLinkStatus" NOT NULL DEFAULT 'active',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "humanConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "officialData" BOOLEAN NOT NULL DEFAULT false,
  "lastCheckedAt" TIMESTAMP(3),
  "lastConfirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LinkedInProfileLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentSnapshot" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "linkedInProfileLinkId" TEXT,
  "externalProfileSourceId" TEXT,
  "title" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "companyPageUrl" TEXT,
  "profileUrl" TEXT,
  "sourceType" "ProfileSourceType" NOT NULL,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "retrievedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,

  CONSTRAINT "EmploymentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentChangeEvent" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "linkedInProfileLinkId" TEXT,
  "externalProfileSourceId" TEXT,
  "priorSnapshotId" TEXT,
  "currentSnapshotId" TEXT,
  "changeType" "EmploymentChangeType" NOT NULL,
  "titleFrom" TEXT,
  "titleTo" TEXT,
  "companyFrom" TEXT,
  "companyTo" TEXT,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,

  CONSTRAINT "EmploymentChangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileMatchCandidate" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "externalProfileSourceId" TEXT,
  "profileUrl" TEXT NOT NULL,
  "normalizedProfileUrl" TEXT NOT NULL,
  "memberId" TEXT,
  "fullName" TEXT NOT NULL,
  "title" TEXT,
  "companyName" TEXT,
  "location" TEXT,
  "sourceType" "ProfileSourceType" NOT NULL,
  "matchStatus" "ProfileMatchStatus" NOT NULL DEFAULT 'suggested',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
  "confirmedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "matchingSignals" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProfileMatchCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipHistory" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "externalProfileSourceId" TEXT,
  "companyName" TEXT NOT NULL,
  "title" TEXT,
  "stage" "RelationshipStage" NOT NULL DEFAULT 'current',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "sourceType" "ProfileSourceType" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RelationshipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionFlag" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "rationale" TEXT,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChampionFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactWatchlist" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "priority" "WatchlistPriority" NOT NULL DEFAULT 'normal',
  "reason" TEXT,
  "notifyOnEmploymentChange" BOOLEAN NOT NULL DEFAULT true,
  "notifyOnBrokenLink" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContactWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerMovementAlert" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "linkedInProfileLinkId" TEXT,
  "externalProfileSourceId" TEXT,
  "employmentChangeEventId" TEXT,
  "priority" "AlertPriority" NOT NULL DEFAULT 'medium',
  "status" "AlertStatus" NOT NULL DEFAULT 'open',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,

  CONSTRAINT "CareerMovementAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedInProfileLink_leadId_normalizedProfileUrl_key"
  ON "LinkedInProfileLink"("leadId", "normalizedProfileUrl");

-- CreateIndex
CREATE INDEX "LinkedInProfileLink_normalizedProfileUrl_idx"
  ON "LinkedInProfileLink"("normalizedProfileUrl");

-- CreateIndex
CREATE INDEX "EmploymentSnapshot_leadId_retrievedAt_idx"
  ON "EmploymentSnapshot"("leadId", "retrievedAt");

-- CreateIndex
CREATE INDEX "EmploymentChangeEvent_leadId_detectedAt_idx"
  ON "EmploymentChangeEvent"("leadId", "detectedAt");

-- CreateIndex
CREATE INDEX "ProfileMatchCandidate_leadId_matchStatus_idx"
  ON "ProfileMatchCandidate"("leadId", "matchStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionFlag_leadId_key" ON "ChampionFlag"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactWatchlist_leadId_key" ON "ContactWatchlist"("leadId");

-- CreateIndex
CREATE INDEX "CareerMovementAlert_leadId_status_triggeredAt_idx"
  ON "CareerMovementAlert"("leadId", "status", "triggeredAt");

-- AddForeignKey
ALTER TABLE "LinkedInProfileLink"
  ADD CONSTRAINT "LinkedInProfileLink_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedInProfileLink"
  ADD CONSTRAINT "LinkedInProfileLink_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentSnapshot"
  ADD CONSTRAINT "EmploymentSnapshot_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentSnapshot"
  ADD CONSTRAINT "EmploymentSnapshot_linkedInProfileLinkId_fkey"
  FOREIGN KEY ("linkedInProfileLinkId") REFERENCES "LinkedInProfileLink"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentSnapshot"
  ADD CONSTRAINT "EmploymentSnapshot_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentChangeEvent"
  ADD CONSTRAINT "EmploymentChangeEvent_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentChangeEvent"
  ADD CONSTRAINT "EmploymentChangeEvent_linkedInProfileLinkId_fkey"
  FOREIGN KEY ("linkedInProfileLinkId") REFERENCES "LinkedInProfileLink"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentChangeEvent"
  ADD CONSTRAINT "EmploymentChangeEvent_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentChangeEvent"
  ADD CONSTRAINT "EmploymentChangeEvent_priorSnapshotId_fkey"
  FOREIGN KEY ("priorSnapshotId") REFERENCES "EmploymentSnapshot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentChangeEvent"
  ADD CONSTRAINT "EmploymentChangeEvent_currentSnapshotId_fkey"
  FOREIGN KEY ("currentSnapshotId") REFERENCES "EmploymentSnapshot"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMatchCandidate"
  ADD CONSTRAINT "ProfileMatchCandidate_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMatchCandidate"
  ADD CONSTRAINT "ProfileMatchCandidate_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipHistory"
  ADD CONSTRAINT "RelationshipHistory_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipHistory"
  ADD CONSTRAINT "RelationshipHistory_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionFlag"
  ADD CONSTRAINT "ChampionFlag_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactWatchlist"
  ADD CONSTRAINT "ContactWatchlist_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMovementAlert"
  ADD CONSTRAINT "CareerMovementAlert_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMovementAlert"
  ADD CONSTRAINT "CareerMovementAlert_linkedInProfileLinkId_fkey"
  FOREIGN KEY ("linkedInProfileLinkId") REFERENCES "LinkedInProfileLink"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMovementAlert"
  ADD CONSTRAINT "CareerMovementAlert_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMovementAlert"
  ADD CONSTRAINT "CareerMovementAlert_employmentChangeEventId_fkey"
  FOREIGN KEY ("employmentChangeEventId") REFERENCES "EmploymentChangeEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
