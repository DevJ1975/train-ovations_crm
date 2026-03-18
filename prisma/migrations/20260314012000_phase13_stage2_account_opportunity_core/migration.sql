CREATE TYPE "AccountStatus" AS ENUM (
  'prospect',
  'active_customer',
  'inactive_customer',
  'partner',
  'archived'
);

CREATE TYPE "OpportunityStage" AS ENUM (
  'prospecting',
  'discovery',
  'demo',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost'
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "domain" TEXT,
  "industry" TEXT,
  "status" "AccountStatus" NOT NULL DEFAULT 'prospect',
  "ownerRepProfileId" TEXT,
  "description" TEXT,
  "hqLocation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountContact" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "relationshipLabel" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "ownerRepProfileId" TEXT,
  "primaryLeadId" TEXT,
  "name" TEXT NOT NULL,
  "stage" "OpportunityStage" NOT NULL DEFAULT 'prospecting',
  "amountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "targetCloseDate" TIMESTAMP(3),
  "closeDate" TIMESTAMP(3),
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountContact_accountId_leadId_key" ON "AccountContact"("accountId", "leadId");
CREATE INDEX "Account_ownerRepProfileId_status_idx" ON "Account"("ownerRepProfileId", "status");
CREATE INDEX "Account_name_idx" ON "Account"("name");
CREATE INDEX "Account_domain_idx" ON "Account"("domain");
CREATE INDEX "AccountContact_leadId_idx" ON "AccountContact"("leadId");
CREATE INDEX "Opportunity_accountId_stage_idx" ON "Opportunity"("accountId", "stage");
CREATE INDEX "Opportunity_ownerRepProfileId_stage_idx" ON "Opportunity"("ownerRepProfileId", "stage");
CREATE INDEX "Opportunity_primaryLeadId_idx" ON "Opportunity"("primaryLeadId");

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_ownerRepProfileId_fkey"
  FOREIGN KEY ("ownerRepProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AccountContact"
  ADD CONSTRAINT "AccountContact_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountContact"
  ADD CONSTRAINT "AccountContact_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_ownerRepProfileId_fkey"
  FOREIGN KEY ("ownerRepProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_primaryLeadId_fkey"
  FOREIGN KEY ("primaryLeadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
