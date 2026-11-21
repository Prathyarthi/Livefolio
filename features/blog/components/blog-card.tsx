import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "@/features/blog/lib/posts";
import { isExternalCover, postPath } from "@/features/blog/lib/seo";
import type { BlogPost } from "@/features/blog/types";

export function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised transition-colors hover:border-border-strong">
      <Link href={postPath(post.slug)} className="flex flex-1 flex-col" aria-label={post.title}>
        <div className="relative aspect-[1200/630] w-full overflow-hidden bg-surface-sunken">
          <Image
            src={post.cover}
            alt=""
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={priority}
            unoptimized={isExternalCover(post.cover)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-label text-text-muted">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden> · </span>
            {post.readingMinutes} min read
          </p>
          <h2 className="mt-2 text-h3 text-text-primary">{post.title}</h2>
          <p className="mt-2 flex-1 text-body-sm text-text-secondary">{post.description}</p>
          <span className="mt-4 text-body-sm font-medium text-brand-primary transition-colors group-hover:text-brand-dark">
            Read article →
          </span>
        </div>
      </Link>
    </article>
  );
}
