-- CreateEnum
CREATE TYPE "OutreachDraftStatus" AS ENUM ('generated', 'reviewed', 'edited', 'approved', 'archived', 'sent');

-- CreateEnum
CREATE TYPE "OutreachDraftType" AS ENUM ('lead_follow_up', 'post_meeting_follow_up', 'reconnect', 'congratulatory', 'reentry', 'champion_recovery', 'proposal_reminder');

-- CreateEnum
CREATE TYPE "BriefStatus" AS ENUM ('generated', 'reviewed', 'edited', 'approved', 'archived');

-- CreateEnum
CREATE TYPE "BriefType" AS ENUM ('account', 'contact');

-- CreateEnum
CREATE TYPE "PriorityEntityType" AS ENUM ('lead', 'account', 'contact', 'opportunity');

-- CreateEnum
CREATE TYPE "PriorityBand" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "RepTaskSuggestionType" AS ENUM ('send_follow_up', 'reconnect_contact', 'review_account_brief', 'update_champion_status', 'schedule_check_in', 'send_proposal_reminder', 'revive_opportunity', 'verify_company_change');

-- CreateEnum
CREATE TYPE "RepTaskSuggestionStatus" AS ENUM ('generated', 'acknowledged', 'dismissed', 'converted', 'archived');

-- CreateTable
CREATE TABLE "OutreachDraft" (
    "id" TEXT NOT NULL,
    "generatedByUserId" TEXT,
    "lastEditedByUserId" TEXT,
    "repProfileId" TEXT,
    "leadId" TEXT,
    "meetingId" TEXT,
    "sourceEmailDraftId" TEXT,
    "type" "OutreachDraftType" NOT NULL DEFAULT 'lead_follow_up',
    "status" "OutreachDraftStatus" NOT NULL DEFAULT 'generated',
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "toneStyle" TEXT,
    "suggestedCta" TEXT,
    "explanation" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "generatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "generationProvider" TEXT,
    "modelName" TEXT,
    "sourceContext" JSONB,
    "generationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftGenerationContext" (
    "id" TEXT NOT NULL,
    "outreachDraftId" TEXT NOT NULL,
    "leadId" TEXT,
    "meetingId" TEXT,
    "repProfileId" TEXT,
    "sourceEntityType" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "contextSummary" TEXT,
    "contextSnapshot" JSONB,
    "explanationData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftGenerationContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountBrief" (
    "id" TEXT NOT NULL,
    "repProfileId" TEXT,
    "leadId" TEXT,
    "meetingId" TEXT,
    "latestRunId" TEXT,
    "status" "BriefStatus" NOT NULL DEFAULT 'generated',
    "companyName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "companyOverview" TEXT,
    "keyContactsSummary" TEXT,
    "championSummary" TEXT,
    "movementSummary" TEXT,
    "opportunityThemes" JSONB,
    "recentActivity" JSONB,
    "openActionItems" JSONB,
    "recommendedNextStep" TEXT,
    "explanation" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "generationProvider" TEXT,
    "modelName" TEXT,
    "generatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "sourceContext" JSONB,
    "generationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactBrief" (
    "id" TEXT NOT NULL,
    "repProfileId" TEXT,
    "leadId" TEXT NOT NULL,
    "meetingId" TEXT,
    "latestRunId" TEXT,
    "status" "BriefStatus" NOT NULL DEFAULT 'generated',
    "summary" TEXT NOT NULL,
    "roleSummary" TEXT,
    "relationshipSummary" TEXT,
    "movementSummary" TEXT,
    "suggestedApproach" TEXT,
    "outreachTiming" TEXT,
    "recommendedNextStep" TEXT,
    "explanation" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "generationProvider" TEXT,
    "modelName" TEXT,
    "generatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "sourceContext" JSONB,
    "generationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefGenerationRun" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "repProfileId" TEXT,
    "leadId" TEXT,
    "meetingId" TEXT,
    "accountBriefId" TEXT,
    "contactBriefId" TEXT,
    "briefType" "BriefType" NOT NULL,
    "status" "BriefStatus" NOT NULL DEFAULT 'generated',
    "inputContext" JSONB,
    "outputSummary" TEXT,
    "explanation" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "generationProvider" TEXT,
    "modelName" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityScore" (
    "id" TEXT NOT NULL,
    "repProfileId" TEXT,
    "leadId" TEXT,
    "entityType" "PriorityEntityType" NOT NULL,
    "entityKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "band" "PriorityBand" NOT NULL,
    "explanation" TEXT,
    "reasonSummary" TEXT,
    "sourceConfidence" DOUBLE PRECISION,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityReason" (
    "id" TEXT NOT NULL,
    "priorityScoreId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "sourceContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorityReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepTaskSuggestion" (
    "id" TEXT NOT NULL,
    "repProfileId" TEXT,
    "leadId" TEXT,
    "meetingId" TEXT,
    "careerMovementAlertId" TEXT,
    "expansionOpportunitySignalId" TEXT,
    "repActionPromptId" TEXT,
    "priorityScoreId" TEXT,
    "type" "RepTaskSuggestionType" NOT NULL,
    "status" "RepTaskSuggestionStatus" NOT NULL DEFAULT 'generated',
    "priority" "AlertPriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "explanation" TEXT,
    "recommendedDueAt" TIMESTAMP(3),
    "confidenceScore" DOUBLE PRECISION,
    "sourceContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepTaskSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachDraft_leadId_status_idx" ON "OutreachDraft"("leadId", "status");
CREATE INDEX "OutreachDraft_repProfileId_type_idx" ON "OutreachDraft"("repProfileId", "type");
CREATE INDEX "OutreachDraft_meetingId_generatedAt_idx" ON "OutreachDraft"("meetingId", "generatedAt");
CREATE INDEX "DraftGenerationContext_outreachDraftId_idx" ON "DraftGenerationContext"("outreachDraftId");
CREATE INDEX "DraftGenerationContext_sourceEntityType_sourceEntityId_idx" ON "DraftGenerationContext"("sourceEntityType", "sourceEntityId");
CREATE UNIQUE INDEX "AccountBrief_latestRunId_key" ON "AccountBrief"("latestRunId");
CREATE INDEX "AccountBrief_repProfileId_generatedAt_idx" ON "AccountBrief"("repProfileId", "generatedAt");
CREATE INDEX "AccountBrief_leadId_status_idx" ON "AccountBrief"("leadId", "status");
CREATE UNIQUE INDEX "ContactBrief_latestRunId_key" ON "ContactBrief"("latestRunId");
CREATE INDEX "ContactBrief_leadId_generatedAt_idx" ON "ContactBrief"("leadId", "generatedAt");
CREATE INDEX "ContactBrief_repProfileId_status_idx" ON "ContactBrief"("repProfileId", "status");
CREATE INDEX "BriefGenerationRun_leadId_briefType_idx" ON "BriefGenerationRun"("leadId", "briefType");
CREATE INDEX "BriefGenerationRun_repProfileId_generatedAt_idx" ON "BriefGenerationRun"("repProfileId", "generatedAt");
CREATE UNIQUE INDEX "PriorityScore_entityType_entityKey_key" ON "PriorityScore"("entityType", "entityKey");
CREATE INDEX "PriorityScore_band_lastEvaluatedAt_idx" ON "PriorityScore"("band", "lastEvaluatedAt");
CREATE INDEX "PriorityScore_repProfileId_band_idx" ON "PriorityScore"("repProfileId", "band");
CREATE INDEX "PriorityReason_priorityScoreId_code_idx" ON "PriorityReason"("priorityScoreId", "code");
CREATE INDEX "RepTaskSuggestion_repProfileId_status_idx" ON "RepTaskSuggestion"("repProfileId", "status");
CREATE INDEX "RepTaskSuggestion_leadId_priority_idx" ON "RepTaskSuggestion"("leadId", "priority");

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_lastEditedByUserId_fkey" FOREIGN KEY ("lastEditedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_sourceEmailDraftId_fkey" FOREIGN KEY ("sourceEmailDraftId") REFERENCES "EmailDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DraftGenerationContext" ADD CONSTRAINT "DraftGenerationContext_outreachDraftId_fkey" FOREIGN KEY ("outreachDraftId") REFERENCES "OutreachDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DraftGenerationContext" ADD CONSTRAINT "DraftGenerationContext_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DraftGenerationContext" ADD CONSTRAINT "DraftGenerationContext_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DraftGenerationContext" ADD CONSTRAINT "DraftGenerationContext_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountBrief" ADD CONSTRAINT "AccountBrief_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountBrief" ADD CONSTRAINT "AccountBrief_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountBrief" ADD CONSTRAINT "AccountBrief_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactBrief" ADD CONSTRAINT "ContactBrief_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContactBrief" ADD CONSTRAINT "ContactBrief_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactBrief" ADD CONSTRAINT "ContactBrief_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_accountBriefId_fkey" FOREIGN KEY ("accountBriefId") REFERENCES "AccountBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BriefGenerationRun" ADD CONSTRAINT "BriefGenerationRun_contactBriefId_fkey" FOREIGN KEY ("contactBriefId") REFERENCES "ContactBrief"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PriorityScore" ADD CONSTRAINT "PriorityScore_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriorityScore" ADD CONSTRAINT "PriorityScore_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriorityReason" ADD CONSTRAINT "PriorityReason_priorityScoreId_fkey" FOREIGN KEY ("priorityScoreId") REFERENCES "PriorityScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_repProfileId_fkey" FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_careerMovementAlertId_fkey" FOREIGN KEY ("careerMovementAlertId") REFERENCES "CareerMovementAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_expansionOpportunitySignalId_fkey" FOREIGN KEY ("expansionOpportunitySignalId") REFERENCES "ExpansionOpportunitySignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_repActionPromptId_fkey" FOREIGN KEY ("repActionPromptId") REFERENCES "RepActionPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepTaskSuggestion" ADD CONSTRAINT "RepTaskSuggestion_priorityScoreId_fkey" FOREIGN KEY ("priorityScoreId") REFERENCES "PriorityScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountBrief" ADD CONSTRAINT "AccountBrief_latestRunId_fkey" FOREIGN KEY ("latestRunId") REFERENCES "BriefGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContactBrief" ADD CONSTRAINT "ContactBrief_latestRunId_fkey" FOREIGN KEY ("latestRunId") REFERENCES "BriefGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
