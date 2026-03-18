ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'champion_flag_updated';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'watchlist_updated';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'relationship_milestone_recorded';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'relationship_edge_recorded';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'career_movement_alert_created';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'expansion_opportunity_detected';
ALTER TYPE "ActivityLogType" ADD VALUE IF NOT EXISTS 'rep_action_prompt_created';

ALTER TYPE "EmploymentChangeType" ADD VALUE IF NOT EXISTS 'promoted_internally';
ALTER TYPE "EmploymentChangeType" ADD VALUE IF NOT EXISTS 'moved_to_target_account';
ALTER TYPE "EmploymentChangeType" ADD VALUE IF NOT EXISTS 'moved_from_client_to_prospect';
ALTER TYPE "EmploymentChangeType" ADD VALUE IF NOT EXISTS 'moved_from_prospect_to_competitor';
ALTER TYPE "EmploymentChangeType" ADD VALUE IF NOT EXISTS 'moved_to_strategic_account';

DO $$
BEGIN
  CREATE TYPE "ChampionStatus" AS ENUM ('active', 'former', 'at_risk', 'moved', 'lost', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ChampionPriority" AS ENUM ('low', 'medium', 'high', 'strategic');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "WatchlistCategory" AS ENUM ('strategic_contact', 'former_champion', 'target_company_mover', 'high_value_prospect', 'dormant_contact');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RecordOriginType" AS ENUM ('system_generated', 'user_input', 'external_source', 'ai_generated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RelationshipMilestoneType" AS ENUM ('meeting', 'deal', 'note', 'employment_change', 'promotion', 'client_association', 'champion_status', 'watchlist_added', 'manual_note');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CompanyAssociationType" AS ENUM ('current_employer', 'previous_employer', 'client_account', 'former_client', 'prospect_account', 'competitor_account', 'target_account', 'strategic_account');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ContactAssociationStatus" AS ENUM ('active', 'historical', 'prospective', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExpansionOpportunityType" AS ENUM ('reentry', 'expansion', 'warm_introduction', 'recovery', 'named_account', 'strategic_account');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExpansionOpportunityStatus" AS ENUM ('open', 'reviewed', 'dismissed', 'converted', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RepActionPromptType" AS ENUM ('reconnect', 'congratulate', 'introduce_trainovations', 'schedule_discovery', 'revive_conversation', 'update_relationship_notes', 'notify_manager');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RepActionPromptStatus" AS ENUM ('open', 'acknowledged', 'dismissed', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RelationshipEdgeType" AS ENUM ('rep_to_contact', 'contact_to_company', 'company_transition', 'champion_to_account', 'watchlist_to_contact');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "RelationshipHistory"
  ADD COLUMN IF NOT EXISTS "repProfileId" TEXT,
  ADD COLUMN IF NOT EXISTS "linkedInProfileLinkId" TEXT,
  ADD COLUMN IF NOT EXISTS "originType" "RecordOriginType" NOT NULL DEFAULT 'external_source';

ALTER TABLE "ChampionFlag"
  ADD COLUMN IF NOT EXISTS "ownerRepProfileId" TEXT,
  ADD COLUMN IF NOT EXISTS "priority" "ChampionPriority" NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "status" "ChampionStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "originType" "RecordOriginType" NOT NULL DEFAULT 'user_input',
  ADD COLUMN IF NOT EXISTS "lastStatusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "ContactWatchlist"
  ADD COLUMN IF NOT EXISTS "category" "WatchlistCategory" NOT NULL DEFAULT 'strategic_contact',
  ADD COLUMN IF NOT EXISTS "notifyOnTitleChange" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyOnStaleData" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifyOnTargetCompanyMatch" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "originType" "RecordOriginType" NOT NULL DEFAULT 'user_input',
  ADD COLUMN IF NOT EXISTS "lastEvaluatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;

ALTER TABLE "CareerMovementAlert"
  ADD COLUMN IF NOT EXISTS "suggestedNextStep" TEXT,
  ADD COLUMN IF NOT EXISTS "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated';

CREATE TABLE IF NOT EXISTS "RelationshipMilestone" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "repProfileId" TEXT,
  "relationshipHistoryId" TEXT,
  "externalProfileSourceId" TEXT,
  "milestoneType" "RelationshipMilestoneType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "sourceType" "ProfileSourceType",
  "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RelationshipMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContactCompanyAssociation" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "championFlagId" TEXT,
  "externalProfileSourceId" TEXT,
  "companyName" TEXT NOT NULL,
  "companyDomain" TEXT,
  "companyLinkedInUrl" TEXT,
  "associationType" "CompanyAssociationType" NOT NULL,
  "status" "ContactAssociationStatus" NOT NULL DEFAULT 'active',
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "isStrategic" BOOLEAN NOT NULL DEFAULT false,
  "sourceType" "ProfileSourceType",
  "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "lastVerifiedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactCompanyAssociation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpansionOpportunitySignal" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "repProfileId" TEXT,
  "careerMovementAlertId" TEXT,
  "contactCompanyAssociationId" TEXT,
  "employmentChangeEventId" TEXT,
  "opportunityType" "ExpansionOpportunityType" NOT NULL,
  "status" "ExpansionOpportunityStatus" NOT NULL DEFAULT 'open',
  "priority" "AlertPriority" NOT NULL DEFAULT 'medium',
  "companyName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "suggestedNextStep" TEXT,
  "rationale" TEXT,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated',
  "metadata" JSONB,
  "reviewedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpansionOpportunitySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RepActionPrompt" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "repProfileId" TEXT,
  "careerMovementAlertId" TEXT,
  "expansionOpportunitySignalId" TEXT,
  "promptType" "RepActionPromptType" NOT NULL,
  "status" "RepActionPromptStatus" NOT NULL DEFAULT 'open',
  "priority" "AlertPriority" NOT NULL DEFAULT 'medium',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "suggestedAction" TEXT,
  "dueAt" TIMESTAMP(3),
  "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "metadata" JSONB,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actedOnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RepActionPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RelationshipEdge" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "repProfileId" TEXT,
  "contactCompanyAssociationId" TEXT,
  "relationshipHistoryId" TEXT,
  "edgeType" "RelationshipEdgeType" NOT NULL,
  "label" TEXT NOT NULL,
  "sourceType" "ProfileSourceType",
  "originType" "RecordOriginType" NOT NULL DEFAULT 'system_generated',
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "strengthScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RelationshipEdge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RelationshipHistory_leadId_stage_startDate_idx"
  ON "RelationshipHistory"("leadId", "stage", "startDate");

CREATE INDEX IF NOT EXISTS "RelationshipMilestone_leadId_occurredAt_idx"
  ON "RelationshipMilestone"("leadId", "occurredAt");

CREATE INDEX IF NOT EXISTS "ContactCompanyAssociation_leadId_companyName_associationType_idx"
  ON "ContactCompanyAssociation"("leadId", "companyName", "associationType");

CREATE INDEX IF NOT EXISTS "ExpansionOpportunitySignal_leadId_status_priority_createdAt_idx"
  ON "ExpansionOpportunitySignal"("leadId", "status", "priority", "createdAt");

CREATE INDEX IF NOT EXISTS "RepActionPrompt_leadId_status_priority_generatedAt_idx"
  ON "RepActionPrompt"("leadId", "status", "priority", "generatedAt");

CREATE INDEX IF NOT EXISTS "RelationshipEdge_leadId_edgeType_createdAt_idx"
  ON "RelationshipEdge"("leadId", "edgeType", "createdAt");

ALTER TABLE "RelationshipHistory"
  ADD CONSTRAINT "RelationshipHistory_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipHistory"
  ADD CONSTRAINT "RelationshipHistory_linkedInProfileLinkId_fkey"
  FOREIGN KEY ("linkedInProfileLinkId") REFERENCES "LinkedInProfileLink"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChampionFlag"
  ADD CONSTRAINT "ChampionFlag_ownerRepProfileId_fkey"
  FOREIGN KEY ("ownerRepProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipMilestone"
  ADD CONSTRAINT "RelationshipMilestone_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RelationshipMilestone"
  ADD CONSTRAINT "RelationshipMilestone_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipMilestone"
  ADD CONSTRAINT "RelationshipMilestone_relationshipHistoryId_fkey"
  FOREIGN KEY ("relationshipHistoryId") REFERENCES "RelationshipHistory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipMilestone"
  ADD CONSTRAINT "RelationshipMilestone_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactCompanyAssociation"
  ADD CONSTRAINT "ContactCompanyAssociation_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactCompanyAssociation"
  ADD CONSTRAINT "ContactCompanyAssociation_championFlagId_fkey"
  FOREIGN KEY ("championFlagId") REFERENCES "ChampionFlag"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactCompanyAssociation"
  ADD CONSTRAINT "ContactCompanyAssociation_externalProfileSourceId_fkey"
  FOREIGN KEY ("externalProfileSourceId") REFERENCES "ExternalProfileSource"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExpansionOpportunitySignal"
  ADD CONSTRAINT "ExpansionOpportunitySignal_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpansionOpportunitySignal"
  ADD CONSTRAINT "ExpansionOpportunitySignal_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExpansionOpportunitySignal"
  ADD CONSTRAINT "ExpansionOpportunitySignal_careerMovementAlertId_fkey"
  FOREIGN KEY ("careerMovementAlertId") REFERENCES "CareerMovementAlert"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExpansionOpportunitySignal"
  ADD CONSTRAINT "ExpansionOpportunitySignal_contactCompanyAssociationId_fkey"
  FOREIGN KEY ("contactCompanyAssociationId") REFERENCES "ContactCompanyAssociation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ExpansionOpportunitySignal"
  ADD CONSTRAINT "ExpansionOpportunitySignal_employmentChangeEventId_fkey"
  FOREIGN KEY ("employmentChangeEventId") REFERENCES "EmploymentChangeEvent"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepActionPrompt"
  ADD CONSTRAINT "RepActionPrompt_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepActionPrompt"
  ADD CONSTRAINT "RepActionPrompt_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepActionPrompt"
  ADD CONSTRAINT "RepActionPrompt_careerMovementAlertId_fkey"
  FOREIGN KEY ("careerMovementAlertId") REFERENCES "CareerMovementAlert"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RepActionPrompt"
  ADD CONSTRAINT "RepActionPrompt_expansionOpportunitySignalId_fkey"
  FOREIGN KEY ("expansionOpportunitySignalId") REFERENCES "ExpansionOpportunitySignal"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipEdge"
  ADD CONSTRAINT "RelationshipEdge_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RelationshipEdge"
  ADD CONSTRAINT "RelationshipEdge_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipEdge"
  ADD CONSTRAINT "RelationshipEdge_contactCompanyAssociationId_fkey"
  FOREIGN KEY ("contactCompanyAssociationId") REFERENCES "ContactCompanyAssociation"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipEdge"
  ADD CONSTRAINT "RelationshipEdge_relationshipHistoryId_fkey"
  FOREIGN KEY ("relationshipHistoryId") REFERENCES "RelationshipHistory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
