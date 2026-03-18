-- AlterEnum
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'meeting_processed';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'meeting_note_created';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'meeting_follow_up_drafted';

-- AlterEnum
ALTER TYPE "MeetingArtifactType" ADD VALUE IF NOT EXISTS 'drive_link';

-- CreateEnum
CREATE TYPE "MeetingArtifactStatus" AS ENUM (
  'pending',
  'available',
  'missing',
  'failed',
  'linked'
);

-- AlterEnum
ALTER TYPE "AutomationJobType" ADD VALUE IF NOT EXISTS 'meeting_note_creation';
ALTER TYPE "AutomationJobType" ADD VALUE IF NOT EXISTS 'follow_up_email_draft';
ALTER TYPE "AutomationJobType" ADD VALUE IF NOT EXISTS 'drive_artifact_link';

-- CreateEnum
CREATE TYPE "LeadNoteSourceType" AS ENUM (
  'user_authored',
  'ai_generated',
  'system_generated'
);

-- CreateEnum
CREATE TYPE "EmailDraftStatus" AS ENUM (
  'draft',
  'reviewed',
  'approved',
  'sent',
  'archived'
);

-- CreateEnum
CREATE TYPE "EmailDraftType" AS ENUM (
  'follow_up',
  'proposal',
  'check_in',
  'custom'
);

-- CreateEnum
CREATE TYPE "MeetingParticipantRole" AS ENUM (
  'host',
  'internal_rep',
  'external_attendee',
  'unknown'
);

-- AlterTable
ALTER TABLE "LeadNote"
  ADD COLUMN "meetingId" TEXT,
  ADD COLUMN "callSummaryId" TEXT,
  ADD COLUMN "sourceType" "LeadNoteSourceType" NOT NULL DEFAULT 'user_authored',
  ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "Meeting"
  ADD COLUMN "repProfileId" TEXT,
  ADD COLUMN "leadId" TEXT,
  ADD COLUMN "calendarEventId" TEXT,
  ADD COLUMN "participantCount" INTEGER,
  ADD COLUMN "hasRecording" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hasTranscript" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recordingAvailableAt" TIMESTAMP(3),
  ADD COLUMN "transcriptAvailableAt" TIMESTAMP(3),
  ADD COLUMN "processingStatus" "SyncStatus" NOT NULL DEFAULT 'idle',
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "providerMetadata" JSONB;

-- AlterTable
ALTER TABLE "MeetingArtifact"
  ADD COLUMN "status" "MeetingArtifactStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "externalArtifactId" TEXT,
  ADD COLUMN "sourceProvider" "ConnectedProvider",
  ADD COLUMN "driveFileId" TEXT,
  ADD COLUMN "contentText" TEXT,
  ADD COLUMN "contentLanguage" TEXT,
  ADD COLUMN "availableAt" TIMESTAMP(3),
  ADD COLUMN "rawPayload" JSONB;

-- AlterTable
ALTER TABLE "CallSummary"
  ADD COLUMN "keyDiscussionPoints" JSONB,
  ADD COLUMN "recommendedNextStep" TEXT,
  ADD COLUMN "followUpSnippet" TEXT,
  ADD COLUMN "generationProvider" TEXT,
  ADD COLUMN "sourceArtifactIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "generationMetadata" JSONB;

-- AlterTable
ALTER TABLE "ActionItem"
  ADD COLUMN "leadId" TEXT,
  ADD COLUMN "sourceExcerpt" TEXT,
  ADD COLUMN "confidenceLabel" TEXT,
  ADD COLUMN "generatedAt" TIMESTAMP(3),
  ADD COLUMN "providerMetadata" JSONB;

-- AlterTable
ALTER TABLE "NotionSyncRecord"
  ADD COLUMN "meetingId" TEXT,
  ADD COLUMN "callSummaryId" TEXT,
  ADD COLUMN "emailDraftId" TEXT;

-- CreateTable
CREATE TABLE "MeetingParticipant" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "externalUserId" TEXT,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "role" "MeetingParticipantRole" NOT NULL DEFAULT 'unknown',
  "attended" BOOLEAN NOT NULL DEFAULT true,
  "providerMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "repProfileId" TEXT,
  "leadId" TEXT,
  "meetingId" TEXT,
  "connectedAccountId" TEXT,
  "type" "EmailDraftType" NOT NULL DEFAULT 'follow_up',
  "status" "EmailDraftStatus" NOT NULL DEFAULT 'draft',
  "subject" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "recipientEmail" TEXT,
  "modelName" TEXT,
  "generationProvider" TEXT,
  "generatedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "providerMetadata" JSONB,
  "generationMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_leadId_status_idx" ON "Meeting"("leadId", "status");

-- CreateIndex
CREATE INDEX "Meeting_repProfileId_startAt_idx" ON "Meeting"("repProfileId", "startAt");

-- CreateIndex
CREATE INDEX "MeetingArtifact_meetingId_type_idx" ON "MeetingArtifact"("meetingId", "type");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_role_idx" ON "MeetingParticipant"("meetingId", "role");

-- CreateIndex
CREATE INDEX "ActionItem_leadId_status_idx" ON "ActionItem"("leadId", "status");

-- CreateIndex
CREATE INDEX "EmailDraft_leadId_status_idx" ON "EmailDraft"("leadId", "status");

-- CreateIndex
CREATE INDEX "EmailDraft_meetingId_type_idx" ON "EmailDraft"("meetingId", "type");

-- AddForeignKey
ALTER TABLE "LeadNote"
  ADD CONSTRAINT "LeadNote_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote"
  ADD CONSTRAINT "LeadNote_callSummaryId_fkey"
  FOREIGN KEY ("callSummaryId") REFERENCES "CallSummary"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_calendarEventId_fkey"
  FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant"
  ADD CONSTRAINT "MeetingParticipant_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem"
  ADD CONSTRAINT "ActionItem_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft"
  ADD CONSTRAINT "EmailDraft_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft"
  ADD CONSTRAINT "EmailDraft_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft"
  ADD CONSTRAINT "EmailDraft_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft"
  ADD CONSTRAINT "EmailDraft_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDraft"
  ADD CONSTRAINT "EmailDraft_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionSyncRecord"
  ADD CONSTRAINT "NotionSyncRecord_meetingId_fkey"
  FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionSyncRecord"
  ADD CONSTRAINT "NotionSyncRecord_callSummaryId_fkey"
  FOREIGN KEY ("callSummaryId") REFERENCES "CallSummary"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotionSyncRecord"
  ADD CONSTRAINT "NotionSyncRecord_emailDraftId_fkey"
  FOREIGN KEY ("emailDraftId") REFERENCES "EmailDraft"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
