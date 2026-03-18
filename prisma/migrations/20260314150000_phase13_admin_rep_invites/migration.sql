ALTER TABLE "User"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "invitedByUserId" TEXT,
  ADD COLUMN "invitationSentAt" TIMESTAMP(3),
  ADD COLUMN "invitationAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE INDEX "User_invitedByUserId_idx" ON "User"("invitedByUserId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
