-- CreateEnum
CREATE TYPE "ConnectedProvider" AS ENUM (
  'google_auth',
  'google_gmail',
  'google_calendar',
  'google_drive',
  'zoom',
  'notion'
);

-- CreateEnum
CREATE TYPE "ConnectedAccountType" AS ENUM ('oauth', 'api_token', 'service_account');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM (
  'pending',
  'connected',
  'disconnected',
  'expired',
  'error'
);

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM (
  'idle',
  'pending',
  'syncing',
  'success',
  'error',
  'disabled'
);

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('scheduled', 'completed', 'canceled', 'processing');

-- CreateEnum
CREATE TYPE "MeetingArtifactType" AS ENUM (
  'recording',
  'transcript',
  'chat',
  'note',
  'summary'
);

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM (
  'received',
  'verified',
  'processed',
  'failed',
  'ignored'
);

-- CreateEnum
CREATE TYPE "AutomationJobType" AS ENUM (
  'zoom_meeting_ingest',
  'call_summary_generation',
  'action_item_extraction',
  'crm_note_sync',
  'calendar_follow_up',
  'notion_sync'
);

-- CreateEnum
CREATE TYPE "AutomationJobStatus" AS ENUM (
  'queued',
  'running',
  'completed',
  'failed',
  'skipped'
);

-- CreateEnum
CREATE TYPE "CallSummaryStatus" AS ENUM ('pending', 'generated', 'failed');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('open', 'done', 'dismissed');

-- CreateEnum
CREATE TYPE "NoteDestinationType" AS ENUM (
  'notion_page',
  'notion_database',
  'crm_note'
);

-- AlterTable
ALTER TABLE "User"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "ConnectedAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "ConnectedProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "accountType" "ConnectedAccountType" NOT NULL DEFAULT 'oauth',
  "connectionStatus" "ConnectionStatus" NOT NULL DEFAULT 'pending',
  "displayName" TEXT,
  "accountEmail" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenType" TEXT,
  "scopes" TEXT[],
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "lastRefreshedAt" TIMESTAMP(3),
  "lastSyncedAt" TIMESTAMP(3),
  "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
  "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
  "providerMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectedAccountId" TEXT,
  "provider" "ConnectedProvider" NOT NULL,
  "externalEventId" TEXT NOT NULL,
  "calendarId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "sourceUrl" TEXT,
  "syncStatus" "SyncStatus" NOT NULL DEFAULT 'idle',
  "rawPayload" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectedAccountId" TEXT,
  "provider" "ConnectedProvider" NOT NULL,
  "externalMeetingId" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "joinUrl" TEXT,
  "hostEmail" TEXT,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "status" "MeetingStatus" NOT NULL DEFAULT 'scheduled',
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingArtifact" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "type" "MeetingArtifactType" NOT NULL,
  "title" TEXT,
  "sourceUrl" TEXT,
  "storageUrl" TEXT,
  "mimeType" TEXT,
  "providerMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MeetingArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "connectedAccountId" TEXT,
  "meetingId" TEXT,
  "provider" "ConnectedProvider",
  "type" "AutomationJobType" NOT NULL,
  "status" "AutomationJobStatus" NOT NULL DEFAULT 'queued',
  "payload" JSONB,
  "result" JSONB,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "scheduledFor" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSummary" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "status" "CallSummaryStatus" NOT NULL DEFAULT 'pending',
  "summary" TEXT,
  "modelName" TEXT,
  "generatedAt" TIMESTAMP(3),
  "providerMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CallSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "callSummaryId" TEXT,
  "description" TEXT NOT NULL,
  "assigneeName" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" "ActionItemStatus" NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotionSyncRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectedAccountId" TEXT,
  "destinationType" "NoteDestinationType" NOT NULL,
  "sourceEntityType" TEXT NOT NULL,
  "sourceEntityId" TEXT NOT NULL,
  "notionPageId" TEXT,
  "notionDatabaseId" TEXT,
  "syncStatus" "SyncStatus" NOT NULL DEFAULT 'idle',
  "externalUrl" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotionSyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" "ConnectedProvider" NOT NULL,
  "eventType" TEXT NOT NULL,
  "deliveryId" TEXT,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'received',
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "headers" JSONB,
  "payload" JSONB NOT NULL,
  "errorMessage" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "connectedAccountId" TEXT,
  "meetingId" TEXT,

  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_provider_providerAccountId_key"
  ON "ConnectedAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_userId_provider_key"
  ON "ConnectedAccount"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_provider_externalEventId_key"
  ON "CalendarEvent"("provider", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_provider_externalMeetingId_key"
  ON "Meeting"("provider", "externalMeetingId");

-- CreateIndex
CREATE UNIQUE INDEX "CallSummary_meetingId_key"
  ON "CallSummary"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_deliveryId_key"
  ON "WebhookEvent"("provider", "deliveryId");

-- AddForeignKey
ALTER TABLE "ConnectedAccount"
  ADD CONSTRAINT "ConnectedAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingArtifact"
  ADD CONSTRAINT "MeetingArtifact_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob"
  ADD CONSTRAINT "AutomationJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob"
  ADD CONSTRAINT "AutomationJob_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob"
  ADD CONSTRAINT "AutomationJob_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSummary"
  ADD CONSTRAINT "CallSummary_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem"
  ADD CONSTRAINT "ActionItem_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem"
  ADD CONSTRAINT "ActionItem_callSummaryId_fkey"
  FOREIGN KEY ("callSummaryId") REFERENCES "CallSummary"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionSyncRecord"
  ADD CONSTRAINT "NotionSyncRecord_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionSyncRecord"
  ADD CONSTRAINT "NotionSyncRecord_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent"
  ADD CONSTRAINT "WebhookEvent_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
