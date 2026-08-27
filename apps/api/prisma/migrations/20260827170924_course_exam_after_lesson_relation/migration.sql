-- AddForeignKey
ALTER TABLE "CourseExam" ADD CONSTRAINT "CourseExam_afterLessonId_fkey" FOREIGN KEY ("afterLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
