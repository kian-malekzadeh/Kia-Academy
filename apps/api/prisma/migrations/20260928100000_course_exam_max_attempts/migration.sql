-- EXAM-4: per-exam attempt cap.
-- Admins can limit how many graded attempts (SUBMITTED) a learner may take on
-- a course exam. Default 3 preserves the previous de-facto behavior for
-- existing rows while giving every exam a defensible policy going forward.

ALTER TABLE "CourseExam"
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3;
