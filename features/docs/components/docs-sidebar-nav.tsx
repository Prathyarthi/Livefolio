"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getDocCategories, getDocHref } from "@/features/docs/lib/docs";
import { cn } from "@/lib/utils";

type DocsSidebarNavProps = {
  onNavigate?: () => void;
};

export function DocsSidebarNav({ onNavigate }: DocsSidebarNavProps) {
  const pathname = usePathname();
  const categories = getDocCategories();

  return (
    <nav aria-label="Docs" className="space-y-1 text-sm">
      <Link
        href="/docs"
        onClick={onNavigate}
        className={cn(
          "mb-3 flex items-center rounded-md px-2 py-1.5 font-medium transition-colors hover:bg-surface-sunken",
          pathname === "/docs" ? "text-text-primary" : "text-text-secondary",
        )}
      >
        Overview
      </Link>
      {categories.map((category) => {
        const Icon = category.icon;
        const categoryHref = getDocHref(category.slug);
        const isActiveCategory = pathname.startsWith(categoryHref);

        return (
          <Collapsible
            key={category.slug}
            defaultOpen
            className="group/collapsible"
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-semibold text-text-primary transition-colors hover:bg-surface-sunken">
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActiveCategory ? "text-brand-primary" : "text-text-muted",
                )}
                aria-hidden
              />
              <span className="flex-1">{category.title}</span>
              <ChevronRight
                className="size-3.5 shrink-0 text-text-muted transition-transform group-data-[state=open]/collapsible:rotate-90"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-1 mb-3 ml-4 space-y-0.5 border-l border-border-default pl-2">
                {category.articles.map((article) => {
                  const href = getDocHref(category.slug, article.slug);
                  const isActive = pathname === href;
                  return (
                    <li key={article.slug}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-2 py-1.5 leading-snug transition-colors",
                          isActive
                            ? "bg-surface-sunken font-medium text-text-primary"
                            : "text-text-secondary hover:bg-surface-sunken/70 hover:text-text-primary",
                        )}
                      >
                        {article.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
