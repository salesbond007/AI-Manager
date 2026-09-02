-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "ToolKind" AS ENUM ('WEB_APP', 'AGENT', 'SCHEDULED_BATCH');

-- CreateEnum
CREATE TYPE "DevStatus" AS ENUM ('PLANNING', 'IN_DEVELOPMENT', 'ACTIVE', 'PAUSED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "RunMode" AS ENUM ('ALWAYS_ON', 'SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('OK', 'WARNING', 'DOWN', 'ERROR', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "kind" "ToolKind" NOT NULL,
    "purpose" TEXT NOT NULL,
    "devStatus" "DevStatus" NOT NULL DEFAULT 'PLANNING',
    "runMode" "RunMode" NOT NULL,
    "servicesUsed" TEXT NOT NULL,
    "repoUrl" TEXT,
    "dashboardUrl" TEXT,
    "lastDeployedAt" TIMESTAMP(3),
    "apiKeyScopeNote" TEXT,
    "apiKeyLastRotatedAt" TIMESTAMP(3),
    "reportKeyHash" TEXT,
    "reportKeyLastRotatedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusReport" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "status" "HealthStatus" NOT NULL,
    "message" TEXT,
    "processedCount" INTEGER,
    "successCount" INTEGER,
    "nextRunAt" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "toolId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_reportKeyHash_key" ON "Tool"("reportKeyHash");

-- CreateIndex
CREATE INDEX "StatusReport_toolId_reportedAt_idx" ON "StatusReport"("toolId", "reportedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusReport" ADD CONSTRAINT "StatusReport_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
