-- EXAM-3: pin exam question snapshots on attempts.
-- Both attempt tables gain an immutable `questions` jsonb snapshot taken when the
-- attempt starts, so edits to live exam content can never alter grading for an
-- in-flight or graded attempt.

-- 1. Readiness exam attempts (blueprint bank questions).
ALTER TABLE "ExamAttempt"
  ADD COLUMN "questions" JSONB;

-- 2. Course exam attempts (per-exam question payload).
ALTER TABLE "CourseExamAttempt"
  ADD COLUMN "questions" JSONB;
