-- CreateIndex
CREATE INDEX "ChallengeSubmission_userId_createdAt_idx" ON "ChallengeSubmission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LessonProgress_lessonId_idx" ON "LessonProgress"("lessonId");

-- CreateIndex
CREATE INDEX "Payment_gatewayRef_idx" ON "Payment"("gatewayRef");

-- CreateIndex
CREATE INDEX "ReadinessTest_userId_createdAt_idx" ON "ReadinessTest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Roadmap_userId_createdAt_idx" ON "Roadmap"("userId", "createdAt");
