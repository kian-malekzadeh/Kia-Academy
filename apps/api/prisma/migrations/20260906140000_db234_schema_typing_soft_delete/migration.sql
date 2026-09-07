-- DB-2: DB-enforced state types (previously validated only in app code).
-- DB-3: JSON payloads persisted as text → jsonb (queryable, type-checked, indexable).
-- DB-4: soft-delete strategy for financial/audit records.

-- ============================================================
-- DB-2 (1): User.status text → UserStatus enum
-- ============================================================
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus"
  USING ("status"::"UserStatus");
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- ============================================================
-- DB-2 (2): Order.source text → OrderSource enum
-- ============================================================
CREATE TYPE "OrderSource" AS ENUM ('DIRECT', 'CART');
ALTER TABLE "Order" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "source" TYPE "OrderSource"
  USING ("source"::"OrderSource");
ALTER TABLE "Order" ALTER COLUMN "source" SET DEFAULT 'DIRECT';

-- ============================================================
-- DB-2 (3): Entitlement.resourceType text → EntitlementResourceType enum
-- Canonical learner vocabulary: course | roadmap | readiness.
-- Any legacy rows (e.g. 'readiness_test'/'roadmap_bundle' written by the old
-- admin grant form) are remapped to the canonical values first so the USING
-- cast cannot fail.
-- ============================================================
CREATE TYPE "EntitlementResourceType" AS ENUM ('course', 'roadmap', 'readiness');
UPDATE "Entitlement" SET "resourceType" = CASE "resourceType"
    WHEN 'readiness_test' THEN 'readiness'
    WHEN 'roadmap_bundle' THEN 'roadmap'
    ELSE "resourceType"
  END;
ALTER TABLE "Entitlement" ALTER COLUMN "resourceType" TYPE "EntitlementResourceType"
  USING ("resourceType"::"EntitlementResourceType");

-- ============================================================
-- DB-3: text JSON columns → jsonb
-- ============================================================
ALTER TABLE "Assessment" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;
ALTER TABLE "Roadmap" ALTER COLUMN "modules" TYPE JSONB USING "modules"::jsonb;
ALTER TABLE "Roadmap" ALTER COLUMN "profile" TYPE JSONB USING "profile"::jsonb;
ALTER TABLE "Roadmap" ALTER COLUMN "pricing" TYPE JSONB USING "pricing"::jsonb;
ALTER TABLE "ReadinessTest" ALTER COLUMN "scores" TYPE JSONB USING "scores"::jsonb;
ALTER TABLE "ReadinessTest" ALTER COLUMN "percentages" TYPE JSONB USING "percentages"::jsonb;
ALTER TABLE "ReadinessTest" ALTER COLUMN "verdict" TYPE JSONB USING "verdict"::jsonb;
ALTER TABLE "PersonalityResult" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;
ALTER TABLE "PersonalityResult" ALTER COLUMN "scores" TYPE JSONB USING "scores"::jsonb;
ALTER TABLE "ChallengeSubmission" ALTER COLUMN "result" TYPE JSONB USING "result"::jsonb;
ALTER TABLE "Payment" ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::jsonb;
ALTER TABLE "PaymentWebhookEvent" ALTER COLUMN "payload" TYPE JSONB USING "payload"::jsonb;
ALTER TABLE "Invoice" ALTER COLUMN "lineItems" TYPE JSONB USING "lineItems"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "questionIds" TYPE JSONB USING "questionIds"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "answers" DROP DEFAULT;
ALTER TABLE "ExamAttempt" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "answers" SET DEFAULT '{}'::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "domainScores" TYPE JSONB USING "domainScores"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "percentages" TYPE JSONB USING "percentages"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "outcome" TYPE JSONB USING "outcome"::jsonb;
ALTER TABLE "ExamAttempt" ALTER COLUMN "verdict" TYPE JSONB USING "verdict"::jsonb;
ALTER TABLE "CourseExam" ALTER COLUMN "questions" DROP DEFAULT;
ALTER TABLE "CourseExam" ALTER COLUMN "questions" TYPE JSONB USING "questions"::jsonb;
ALTER TABLE "CourseExam" ALTER COLUMN "questions" SET DEFAULT '[]'::jsonb;
ALTER TABLE "CourseExamAttempt" ALTER COLUMN "answers" TYPE JSONB USING "answers"::jsonb;
ALTER TABLE "TestBank" ALTER COLUMN "payload" TYPE JSONB USING "payload"::jsonb;
ALTER TABLE "SiteSetting" ALTER COLUMN "value" TYPE JSONB USING "value"::jsonb;

-- ============================================================
-- DB-4 (1): soft-delete column on User
-- ============================================================
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- ============================================================
-- DB-4 (2): financial/audit records must never vanish via cascade.
-- User deletion previously cascaded into Order (and Order → Payment/Invoice);
-- these FKs become Restrict so a user with financial history can only be
-- soft-deleted. Child rows keep Cascade (removing an order still removes its
-- line items / invoice) because the parent removal is now explicit.
-- ============================================================
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
