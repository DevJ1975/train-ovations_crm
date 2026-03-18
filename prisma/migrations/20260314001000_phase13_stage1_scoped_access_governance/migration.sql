ALTER TABLE "RepProfile"
  ADD COLUMN IF NOT EXISTS "managerUserId" TEXT;

CREATE INDEX IF NOT EXISTS "RepProfile_managerUserId_idx"
  ON "RepProfile"("managerUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'RepProfile_managerUserId_fkey'
  ) THEN
    ALTER TABLE "RepProfile"
      ADD CONSTRAINT "RepProfile_managerUserId_fkey"
      FOREIGN KEY ("managerUserId") REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
