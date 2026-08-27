-- CreateEnum
CREATE TYPE "CourseExamKind" AS ENUM ('MIDTERM', 'FINAL');

-- AlterTable
ALTER TABLE "CourseExam" ADD COLUMN     "afterLessonId" TEXT,
ADD COLUMN     "kind" "CourseExamKind" NOT NULL DEFAULT 'FINAL',
ALTER COLUMN "durationMin" SET DEFAULT 15;
