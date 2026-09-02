-- Challenge submission integrity: submissions are FK-bound to a Challenge row,
-- pin the challenge version, and record language/execution metadata.

-- Backfill: give the pre-existing challenges a version.
ALTER TABLE "Challenge" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Add nullable columns first, backfill, then enforce NOT NULL + FK.
ALTER TABLE "ChallengeSubmission" ADD COLUMN "challengeId" TEXT;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "challengeVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'js';
ALTER TABLE "ChallengeSubmission" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'scored';
ALTER TABLE "ChallengeSubmission" ADD COLUMN "executionTimeMs" INTEGER;
ALTER TABLE "ChallengeSubmission" ADD COLUMN "memoryUsageKb" INTEGER;

-- Backfill existing submissions to the first (seed) challenge so the NOT NULL
-- constraint can be added. There is one bootcamp challenge per deployment.
UPDATE "ChallengeSubmission" SET "challengeId" = (
  SELECT "id" FROM "Challenge" ORDER BY "createdAt" ASC LIMIT 1
) WHERE "challengeId" IS NULL;

ALTER TABLE "ChallengeSubmission" ALTER COLUMN "challengeId" SET NOT NULL;

-- Relationship + indexes.
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_challengeId_fkey"
  FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ChallengeSubmission_challengeId_createdAt_idx" ON "ChallengeSubmission"("challengeId", "createdAt");