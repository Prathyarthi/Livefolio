-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_organizationId_slug_key" ON "workspaces"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "workspaces_organizationId_idx" ON "workspaces"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- AddForeignKey
ALTER TABLE "workspaces"
ADD CONSTRAINT "workspaces_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members"
ADD CONSTRAINT "workspace_members_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members"
ADD CONSTRAINT "workspace_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default workspace per existing organization
INSERT INTO "workspaces" ("id", "organizationId", "name", "slug", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'Hiring', 'general', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations";

-- Assign every org member to that default workspace
INSERT INTO "workspace_members" ("id", "workspaceId", "userId", "createdAt")
SELECT gen_random_uuid()::text, w."id", m."userId", CURRENT_TIMESTAMP
FROM "organization_members" m
INNER JOIN "workspaces" w ON w."organizationId" = m."organizationId" AND w."slug" = 'general';

-- Attach jobs to the default workspace
ALTER TABLE "jobs" ADD COLUMN "workspaceId" TEXT;

UPDATE "jobs" j
SET "workspaceId" = w."id"
FROM "workspaces" w
WHERE w."organizationId" = j."organizationId" AND w."slug" = 'general';

ALTER TABLE "jobs" ALTER COLUMN "workspaceId" SET NOT NULL;

CREATE INDEX "jobs_workspaceId_status_idx" ON "jobs"("workspaceId", "status");

ALTER TABLE "jobs"
ADD CONSTRAINT "jobs_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
