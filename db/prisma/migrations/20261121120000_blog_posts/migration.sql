-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "updated" TEXT,
    "description" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Prathyarthi Kashyap, Founder',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_draft_date_idx" ON "blog_posts"("draft", "date" DESC);
