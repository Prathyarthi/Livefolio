"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AdminBlogEditorPost = {
  id?: string;
  slug: string;
  title: string;
  date: string;
  updated?: string;
  description: string;
  keyword: string;
  cover: string;
  author: string;
  tags: string[];
  content: string;
  draft: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

const EMPTY: AdminBlogEditorPost = {
  slug: "",
  title: "",
  date: todayIso(),
  updated: "",
  description: "",
  keyword: "",
  cover: "/blog/placeholder-cover.jpg",
  author: "Prathyarthi Kashyap, Founder",
  tags: [],
  content: "",
  draft: true,
};

export function AdminBlogEditor({
  initial,
}: {
  initial?: AdminBlogEditorPost;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState<AdminBlogEditorPost>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const tagsText = useMemo(() => form.tags.join(", "), [form.tags]);

  function setField<K extends keyof AdminBlogEditorPost>(
    key: K,
    value: AdminBlogEditorPost[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(asDraft: boolean) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        draft: asDraft,
        updated: form.updated || null,
        tags: form.tags,
      };
      const res = await fetch(
        isEdit ? `/api/admin/blog/${form.id}` : "/api/admin/blog",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await readJson<{ post: { id: string } }>(res);
      toast.success(asDraft ? "Draft saved" : "Post published");
      if (!isEdit) {
        router.replace(`/admin/blog/${data.post.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">
            <Link href="/admin/blog" className="hover:text-text-primary">
              Blog
            </Link>
          </p>
          <h1 className="mt-2 text-h1 text-text-primary">
            {isEdit ? "Edit post" : "New post"}
          </h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Markdown body with optional FAQ section (
            <code className="text-xs">## FAQ</code>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => void onSave(true)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button disabled={saving} onClick={() => void onSave(false)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Title and markdown body.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setField("title", title);
                  if (!slugTouched) setField("slug", slugify(title));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Markdown</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
                className="min-h-[420px] font-mono text-sm"
                placeholder={"## Section\n\nWrite in markdown. Start at ## H2."}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
            <CardDescription>SEO and publishing fields.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setField("slug", e.target.value);
                }}
              />
              <p className="text-xs text-text-muted">/blog/{form.slug || "…"}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updated">Updated</Label>
                <Input
                  id="updated"
                  type="date"
                  value={form.updated ?? ""}
                  onChange={(e) => setField("updated", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="min-h-[96px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={form.keyword}
                onChange={(e) => setField("keyword", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover">Cover path</Label>
              <Input
                id="cover"
                value={form.cover}
                onChange={(e) => setField("cover", e.target.value)}
                placeholder="/blog/cover.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setField("author", e.target.value)}
                placeholder="Name, Role"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tagsText}
                onChange={(e) =>
                  setField(
                    "tags",
                    e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="portfolio, resume"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
