CREATE TYPE "MailboxProvider" AS ENUM (
  'gmail',
  'outlook',
  'imap',
  'exchange',
  'other'
);

CREATE TYPE "MailboxConnectionStatus" AS ENUM (
  'pending',
  'connected',
  'disconnected',
  'error'
);

CREATE TYPE "EmailThreadStatus" AS ENUM (
  'open',
  'archived',
  'snoozed'
);

CREATE TYPE "EmailMessageDirection" AS ENUM (
  'inbound',
  'outbound'
);

CREATE TABLE "EmailMailbox" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "connectedAccountId" TEXT,
  "provider" "MailboxProvider" NOT NULL,
  "connectionStatus" "MailboxConnectionStatus" NOT NULL DEFAULT 'pending',
  "label" TEXT NOT NULL,
  "emailAddress" TEXT NOT NULL,
  "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailMailbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailThread" (
  "id" TEXT NOT NULL,
  "mailboxId" TEXT NOT NULL,
  "repProfileId" TEXT,
  "leadId" TEXT,
  "accountId" TEXT,
  "opportunityId" TEXT,
  "providerThreadId" TEXT,
  "subject" TEXT NOT NULL,
  "snippet" TEXT,
  "participants" JSONB,
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  "status" "EmailThreadStatus" NOT NULL DEFAULT 'open',
  "lastMessageAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "direction" "EmailMessageDirection" NOT NULL,
  "subject" TEXT,
  "snippet" TEXT,
  "bodyText" TEXT NOT NULL,
  "fromEmail" TEXT NOT NULL,
  "toEmails" TEXT[],
  "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailMailbox_userId_emailAddress_key" ON "EmailMailbox"("userId", "emailAddress");
CREATE INDEX "EmailMailbox_userId_connectionStatus_idx" ON "EmailMailbox"("userId", "connectionStatus");
CREATE INDEX "EmailThread_mailboxId_lastMessageAt_idx" ON "EmailThread"("mailboxId", "lastMessageAt");
CREATE INDEX "EmailThread_repProfileId_lastMessageAt_idx" ON "EmailThread"("repProfileId", "lastMessageAt");
CREATE INDEX "EmailThread_leadId_lastMessageAt_idx" ON "EmailThread"("leadId", "lastMessageAt");
CREATE INDEX "EmailThread_accountId_lastMessageAt_idx" ON "EmailThread"("accountId", "lastMessageAt");
CREATE INDEX "EmailMessage_threadId_sentAt_idx" ON "EmailMessage"("threadId", "sentAt");

ALTER TABLE "EmailMailbox"
  ADD CONSTRAINT "EmailMailbox_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailMailbox"
  ADD CONSTRAINT "EmailMailbox_connectedAccountId_fkey"
  FOREIGN KEY ("connectedAccountId") REFERENCES "ConnectedAccount"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailThread"
  ADD CONSTRAINT "EmailThread_mailboxId_fkey"
  FOREIGN KEY ("mailboxId") REFERENCES "EmailMailbox"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailThread"
  ADD CONSTRAINT "EmailThread_repProfileId_fkey"
  FOREIGN KEY ("repProfileId") REFERENCES "RepProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailThread"
  ADD CONSTRAINT "EmailThread_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailThread"
  ADD CONSTRAINT "EmailThread_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailThread"
  ADD CONSTRAINT "EmailThread_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EmailMessage"
  ADD CONSTRAINT "EmailMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
