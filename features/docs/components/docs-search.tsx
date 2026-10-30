"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { getAllDocArticles } from "@/features/docs/lib/docs";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 8;

export function DocsSearch({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const articles = useMemo(() => getAllDocArticles(), []);
  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return articles
      .filter(({ article, category }) => {
        const haystack =
          `${article.title} ${article.description} ${category.title}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, MAX_RESULTS);
  }, [articles, query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !isTyping)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  const showResults = open && query.trim().length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search docs"
        aria-label="Search docs"
        className="h-9 pr-12 pl-9"
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlighted((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlighted((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter" && results[highlighted]) {
            event.preventDefault();
            go(results[highlighted].href);
          } else if (event.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      <Kbd className="absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex">
        ⌘K
      </Kbd>

      {showResults ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border-default bg-surface-raised p-1.5 shadow-lg">
          {results.length > 0 ? (
            <ItemGroup>
              {results.map(({ article, category, href }, index) => (
                <Item
                  key={href}
                  size="sm"
                  asChild
                  className={cn(
                    "cursor-pointer",
                    index === highlighted && "bg-surface-sunken",
                  )}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => go(href)}
                    className="w-full text-left"
                  >
                    <ItemMedia>
                      <FileText className="size-4 text-text-muted" aria-hidden />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{article.title}</ItemTitle>
                      <ItemDescription>{category.title}</ItemDescription>
                    </ItemContent>
                  </button>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty className="p-6">
              <EmptyHeader>
                <EmptyTitle>No results</EmptyTitle>
                <EmptyDescription>No articles match “{query}”.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      ) : null}
    </div>
  );
}
