-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'PROCESSING', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CourseExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'PROCESSING', 'SUBMITTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "CourseExamAttempt" DROP COLUMN "status",
ADD COLUMN     "status" "CourseExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "ExamAttempt" DROP COLUMN "status",
ADD COLUMN     "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- One active (non-terminal) attempt per user per exam — race-proof DB invariant.
CREATE UNIQUE INDEX "ExamAttempt_userId_status_active_unique" ON "ExamAttempt"("userId")
  WHERE "status" IN ('IN_PROGRESS', 'PROCESSING');

CREATE UNIQUE INDEX "CourseExamAttempt_userId_examId_active_unique" ON "CourseExamAttempt"("userId", "examId")
  WHERE "status" IN ('IN_PROGRESS', 'PROCESSING');

-- Recreate the standard index (dropped with the old status column).
CREATE INDEX "ExamAttempt_userId_status_idx" ON "ExamAttempt"("userId", "status");