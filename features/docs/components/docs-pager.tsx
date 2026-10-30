import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { DocArticleRef } from "@/features/docs/lib/docs";
import { cn } from "@/lib/utils";

function PagerLink({
  item,
  direction,
}: {
  item: DocArticleRef;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex flex-1 flex-col gap-1 rounded-xl border border-border-default p-4 transition-colors hover:border-border-strong hover:bg-surface-sunken/60",
        isNext && "items-end text-right",
      )}
    >
      <span className="flex items-center gap-1 text-xs text-text-muted">
        {isNext ? null : <ArrowLeft className="size-3.5" aria-hidden />}
        {isNext ? "Next" : "Previous"}
        {isNext ? <ArrowRight className="size-3.5" aria-hidden /> : null}
      </span>
      <span className="text-sm font-semibold text-text-primary">
        {item.article.title}
      </span>
    </Link>
  );
}

export function DocsPager({
  previous,
  next,
}: {
  previous?: DocArticleRef;
  next?: DocArticleRef;
}) {
  return (
    <nav
      aria-label="Article navigation"
      className="mt-12 flex flex-col gap-3 border-t border-border-default pt-8 sm:flex-row"
    >
      {previous ? <PagerLink item={previous} direction="previous" /> : <span className="hidden flex-1 sm:block" />}
      {next ? <PagerLink item={next} direction="next" /> : <span className="hidden flex-1 sm:block" />}
    </nav>
  );
}
