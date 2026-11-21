"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminBlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  draft: boolean;
  description: string;
  updatedAt: string;
};

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readJson<{ posts: AdminBlogPost[] }>(
        await fetch("/api/admin/blog", { cache: "no-store" }),
      );
      setPosts(data.posts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(post: AdminBlogPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setDeletingId(post.id);
    try {
      await readJson(await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" }));
      toast.success("Post deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Content</p>
          <h1 className="mt-2 text-h1 text-text-primary">Blog</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Create, edit and delete Livefolio blog posts. Only admin emails can
            access this.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" />
            New post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Published posts appear on{" "}
            <Link href="/blog" className="underline underline-offset-2">
              /blog
            </Link>
            . Drafts stay private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No CMS posts yet. Markdown files under{" "}
              <code className="text-xs">content/blog</code> still show on the
              public site as a fallback.
            </p>
          ) : (
            <ul className="divide-y divide-border-default">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-text-primary">
                        {post.title}
                      </p>
                      <Badge variant={post.draft ? "secondary" : "default"}>
                        {post.draft ? "Draft" : "Published"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      /blog/{post.slug} · {post.date}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-text-muted">
                      {post.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!post.draft && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          View
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/blog/${post.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === post.id}
                      onClick={() => void onDelete(post)}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingId === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
