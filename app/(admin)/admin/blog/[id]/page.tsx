import { notFound } from "next/navigation";
import { AdminBlogEditor } from "@/features/blog/components/admin-blog-editor";
import { getAdminBlogPostById } from "@/features/blog/lib/admin-store";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBlogEditPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);
  if (!post) notFound();

  return (
    <AdminBlogEditor
      initial={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        date: post.date,
        updated: post.updated ?? "",
        description: post.description,
        keyword: post.keyword,
        cover: post.cover,
        author: post.author,
        tags: post.tags,
        content: post.content,
        draft: post.draft,
      }}
    />
  );
}
