-- Add user account status (ACTIVE default; existing rows stay active) + audit log table.
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "suspendedReason" TEXT;

CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");

-- Immutable admin audit trail.
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL DEFAULT '',
    "actorRole" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "target" TEXT NOT NULL DEFAULT '',
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");
CREATE INDEX "AdminAuditLog_section_action_idx" ON "AdminAuditLog"("section", "action");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");