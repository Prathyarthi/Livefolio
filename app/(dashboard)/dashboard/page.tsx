"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Download,
  ExternalLink,
  Eye,
  Palette,
  Pencil,
  FileText,
} from "lucide-react";
import { usePortfolio } from "@/features/portfolio/api/use-portfolio";
import { CreatePortfolioPrompt } from "@/features/portfolio/components/create-portfolio-prompt";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import { getPortfolioPublicUrl } from "@/lib/domain";

const shortcuts = [
  {
    href: "/dashboard/preview",
    label: "Preview",
    description: "Check the layout before you publish",
    icon: Eye,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    description: "Views and outbound clicks",
    icon: BarChart3,
  },
  {
    href: "/dashboard/templates",
    label: "Templates",
    description: "Switch the look of your site",
    icon: Palette,
  },
  {
    href: "/dashboard/import",
    label: "Import",
    description: "Resume, GitHub, Medium, LeetCode",
    icon: Download,
  },
] as const;

function formatUpdatedAt(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: portfolio, isLoading } = usePortfolio();
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/me");
      if (!res.ok) return null;
      return res.json() as Promise<{
        totalViews: number;
        todayViews: number;
      }>;
    },
    enabled: Boolean(portfolio?.isPublished),
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const updatedLabel = formatUpdatedAt(portfolio?.updatedAt);
  const publicUrl =
    portfolio?.isPublished && portfolio?.slug
      ? getPortfolioPublicUrl(portfolio.slug)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-start gap-[var(--space-6)]">
      <header className="space-y-1">
        <p className="eyebrow uppercase">Overview</p>
        <h1 className="text-h2 text-text-primary">Hi, {firstName}</h1>
        <p className="text-body-sm text-text-secondary">
          {portfolio
            ? "Status, traffic, and the next publish action — edits save as you go."
            : "Create a portfolio to unlock the editor and preview."}
        </p>
      </header>

      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        {!portfolio && !isLoading ? (
          <div className="space-y-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
              <FileText className="h-6 w-6 text-brand-secondary" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-h3 text-text-primary">No portfolio yet</h2>
              <p className="text-body-sm text-text-secondary">
                Create your portfolio to unlock the editor, imports, and preview.
              </p>
            </div>
            <CreatePortfolioPrompt
              className="w-full max-w-xs"
              buttonClassName="sm:min-w-[13rem] sm:w-auto"
              onCreated={() => router.push("/dashboard/edit")}
            />
          </div>
        ) : isLoading ? (
          <div className="space-y-5" aria-busy="true" aria-label="Loading overview">
            <div className="flex items-center justify-between gap-3 border-b border-border-default pb-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-56" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-36" />
              <Skeleton className="h-11 w-32" />
            </div>
          </div>
        ) : portfolio ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-default pb-5">
              <div className="min-w-0 space-y-1">
                {publicUrl ? (
                  <>
                    <p className="text-label uppercase text-text-secondary">
                      Your link
                    </p>
                    <p className="truncate text-mono text-text-primary">
                      {publicUrl}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-label uppercase text-text-secondary">
                      Status
                    </p>
                    <p className="text-body-sm text-text-secondary">
                      Choose your subdomain when you publish.
                    </p>
                  </>
                )}
                {updatedLabel ? (
                  <p className="text-xs text-text-muted">
                    Last edited {updatedLabel}
                  </p>
                ) : null}
              </div>
              <Badge variant={portfolio.isPublished ? "success" : "neutral"}>
                {portfolio.isPublished ? "Live" : "Draft"}
              </Badge>
            </div>

            {portfolio.isPublished && analytics ? (
              <dl className="grid grid-cols-2 gap-3 sm:max-w-sm">
                <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-4 py-3">
                  <dt className="text-label uppercase text-text-muted">
                    Total views
                  </dt>
                  <dd className="mt-1 font-display text-h3 text-text-primary">
                    {analytics.totalViews.toLocaleString()}
                  </dd>
                </div>
                <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-4 py-3">
                  <dt className="text-label uppercase text-text-muted">
                    Today
                  </dt>
                  <dd className="mt-1 font-display text-h3 text-text-primary">
                    {analytics.todayViews.toLocaleString()}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/edit">
                  <Pencil className="h-4 w-4" />
                  Open editor
                </Link>
              </Button>
              {publicUrl ? (
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href={publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View live site
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href="/dashboard/preview">
                    <ExternalLink className="h-4 w-4" />
                    Preview
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {portfolio ? (
        <nav
          aria-label="Quick actions"
          className="grid gap-3 sm:grid-cols-2"
        >
          {shortcuts.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand-fill/12">
                <Icon className="h-5 w-5 text-brand-secondary" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-body-sm font-medium text-text-primary">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-text-secondary">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      ) : null}

      <FlowFooter
        message="Edits autosave. Use preview before you publish."
        next={{ href: "/dashboard/edit", label: "Go to editor" }}
      />
    </div>
  );
}
