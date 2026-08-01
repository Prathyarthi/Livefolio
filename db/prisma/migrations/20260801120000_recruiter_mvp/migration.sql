-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN "openToOpportunities" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "portfolios_isPublished_openToOpportunities_idx" ON "portfolios"("isPublished", "openToOpportunities");

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_candidates" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "portfolioId" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "headline" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "parsedJson" JSONB NOT NULL DEFAULT '{}',
    "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "overallScore" INTEGER,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_social_profiles" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "username" TEXT,
    "cachedStats" JSONB,
    "lastFetched" TIMESTAMP(3),
    "fetchStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "dossier_social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_projects" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "liveUrl" TEXT,
    "sourceUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "origin" TEXT NOT NULL DEFAULT 'resume',
    "meta" JSONB,

    CONSTRAINT "dossier_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_notes" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_signals" (
    "id" TEXT NOT NULL,
    "corpusType" TEXT NOT NULL,
    "candidateId" TEXT,
    "portfolioId" TEXT,
    "orgId" TEXT,
    "displayName" TEXT NOT NULL DEFAULT '',
    "headline" TEXT NOT NULL DEFAULT '',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "titles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectTech" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minYearsEstimate" DOUBLE PRECISION,
    "searchText" TEXT NOT NULL DEFAULT '',
    "platformSignals" JSONB NOT NULL DEFAULT '{}',
    "hasLiveDemo" BOOLEAN NOT NULL DEFAULT false,
    "hasPublishedContent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_search_queries" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "compiledAst" JSONB NOT NULL DEFAULT '{}',
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_orgId_userId_key" ON "organization_members"("orgId", "userId");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE INDEX "recruiter_candidates_orgId_status_idx" ON "recruiter_candidates"("orgId", "status");

-- CreateIndex
CREATE INDEX "recruiter_candidates_orgId_source_idx" ON "recruiter_candidates"("orgId", "source");

-- CreateIndex
CREATE INDEX "recruiter_candidates_portfolioId_idx" ON "recruiter_candidates"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_social_profiles_candidateId_platform_key" ON "dossier_social_profiles"("candidateId", "platform");

-- CreateIndex
CREATE INDEX "dossier_projects_candidateId_idx" ON "dossier_projects"("candidateId");

-- CreateIndex
CREATE INDEX "evaluation_notes_candidateId_createdAt_idx" ON "evaluation_notes"("candidateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_signals_candidateId_key" ON "candidate_signals"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_signals_portfolioId_key" ON "candidate_signals"("portfolioId");

-- CreateIndex
CREATE INDEX "candidate_signals_corpusType_idx" ON "candidate_signals"("corpusType");

-- CreateIndex
CREATE INDEX "candidate_signals_orgId_idx" ON "candidate_signals"("orgId");

-- CreateIndex
CREATE INDEX "recruiter_search_queries_orgId_createdAt_idx" ON "recruiter_search_queries"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_candidates" ADD CONSTRAINT "recruiter_candidates_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_candidates" ADD CONSTRAINT "recruiter_candidates_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_social_profiles" ADD CONSTRAINT "dossier_social_profiles_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "recruiter_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_projects" ADD CONSTRAINT "dossier_projects_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "recruiter_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_notes" ADD CONSTRAINT "evaluation_notes_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "recruiter_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_notes" ADD CONSTRAINT "evaluation_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_signals" ADD CONSTRAINT "candidate_signals_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "recruiter_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_signals" ADD CONSTRAINT "candidate_signals_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_search_queries" ADD CONSTRAINT "recruiter_search_queries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruiter_search_queries" ADD CONSTRAINT "recruiter_search_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
