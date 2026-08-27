-- CreateTable
CREATE TABLE "CourseExam" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "passScore" INTEGER NOT NULL DEFAULT 60,
    "durationMin" INTEGER NOT NULL DEFAULT 10,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "questions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "answers" TEXT,
    "score" INTEGER,
    "passed" BOOLEAN,

    CONSTRAINT "CourseExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseExam_courseId_sortOrder_idx" ON "CourseExam"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "CourseExamAttempt_examId_idx" ON "CourseExamAttempt"("examId");

-- CreateIndex
CREATE INDEX "CourseExamAttempt_userId_examId_idx" ON "CourseExamAttempt"("userId", "examId");

-- AddForeignKey
ALTER TABLE "CourseExam" ADD CONSTRAINT "CourseExam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseExamAttempt" ADD CONSTRAINT "CourseExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "CourseExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseExamAttempt" ADD CONSTRAINT "CourseExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
