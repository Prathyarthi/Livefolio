"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, FileText } from "lucide-react";
import { usePortfolio } from "@/features/portfolio/api/use-portfolio";
import { CreatePortfolioPrompt } from "@/features/portfolio/components/create-portfolio-prompt";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import { getPortfolioPublicUrl } from "@/lib/domain";

const secondaryLinks = [
  { href: "/dashboard/preview", label: "Preview" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/import", label: "Import" },
  { href: "/dashboard/billing", label: "Billing" },
] as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: portfolio, isLoading } = usePortfolio();

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-[var(--space-6)] py-2">
      <header className="space-y-1">
        <p className="eyebrow uppercase">Overview</p>
        <h1 className="text-h2 text-text-primary">Hi, {firstName}</h1>
        <p className="text-body-sm text-text-secondary">
          {portfolio
            ? "Pick up where you left off — edits save as you go."
            : "Create a portfolio to unlock the editor and preview."}
        </p>
      </header>

      <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
        {!portfolio && !isLoading ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-light">
              <FileText className="h-6 w-6 text-brand-primary" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-h3 text-text-primary">No portfolio yet</h2>
              <p className="prose-measure mx-auto text-body-sm text-text-secondary">
                Create your portfolio to unlock the editor, imports, and preview.
              </p>
            </div>
            <CreatePortfolioPrompt
              className="mx-auto w-full max-w-xs items-center"
              buttonClassName="sm:min-w-[13rem] sm:w-auto"
              onCreated={() => router.push("/dashboard/edit")}
            />
          </div>
        ) : isLoading ? (
          <div className="py-10 text-center text-body-sm text-text-muted">
            Loading…
          </div>
        ) : portfolio ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-5">
              <div className="min-w-0 space-y-1">
                {portfolio.isPublished && portfolio.slug ? (
                  <>
                    <p className="text-label uppercase text-text-secondary">
                      Your link
                    </p>
                    <p className="truncate text-mono text-text-primary">
                      {getPortfolioPublicUrl(portfolio.slug)}
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
              </div>
              <Badge variant={portfolio.isPublished ? "success" : "neutral"}>
                {portfolio.isPublished ? "Live" : "Draft"}
              </Badge>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/edit">
                  <Pencil className="h-4 w-4" />
                  Open editor
                </Link>
              </Button>
              {portfolio.isPublished && portfolio.slug ? (
                <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link
                    href={getPortfolioPublicUrl(portfolio.slug)}
                    target="_blank"
                    rel="noreferrer"
                  >
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

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border-default pt-5 text-body-sm">
              {secondaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text-secondary underline-offset-4 transition-colors hover:text-brand-primary hover:underline"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/dashboard/settings"
                className="text-text-secondary underline-offset-4 transition-colors hover:text-brand-primary hover:underline"
              >
                Settings
              </Link>
            </nav>
          </div>
        ) : null}
      </div>

      <FlowFooter
        message="Edits autosave. Use preview before you publish."
        next={{ href: "/dashboard/edit", label: "Go to editor" }}
      />
    </div>
  );
}
