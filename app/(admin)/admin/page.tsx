import type { ComponentType } from "react";
import { FileStack, Globe, TrendingUp, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export default async function AdminOverviewPage() {
  const today = startOfUtcDay();

  const [totalUsers, newUsersToday, totalPortfolios, publishedPortfolios] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.portfolio.count(),
      prisma.portfolio.count({ where: { isPublished: true } }),
    ]);

  const draftPortfolios = Math.max(0, totalPortfolios - publishedPortfolios);
  const publishRate =
    totalPortfolios === 0
      ? 0
      : Math.round((publishedPortfolios / totalPortfolios) * 100);
  const usersWithoutPortfolio = Math.max(0, totalUsers - totalPortfolios);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Snapshot</p>
          <h1 className="mt-2 text-h1 text-text-primary">Overview</h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            Live counts from the database.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised/80 px-3 py-1.5 text-xs text-text-secondary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live · UTC
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <section className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] sm:p-8 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-label uppercase text-text-secondary">
                Total users
              </p>
              <p className="mt-3 font-display text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl">
                {formatCount(totalUsers)}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-light text-brand-primary">
              <Users className="h-6 w-6" aria-hidden />
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              {formatCount(newUsersToday)} new today
            </span>
            <span className="text-xs text-text-muted">
              {formatCount(usersWithoutPortfolio)} without a portfolio
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          <MetricTile
            label="New users today"
            value={formatCount(newUsersToday)}
            hint="Signed up since 00:00 UTC"
            icon={UserPlus}
            accent
          />
          <MetricTile
            label="Published portfolios"
            value={formatCount(publishedPortfolios)}
            hint="Live public sites"
            icon={Globe}
          />
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-label uppercase text-text-secondary">
                Portfolios created
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-text-primary">
                {formatCount(totalPortfolios)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface-sunken text-text-secondary">
              <FileStack className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <p className="mt-4 text-body-sm text-text-muted">
            {formatCount(draftPortfolios)} still in draft
          </p>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-label uppercase text-text-secondary">
                Publish rate
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-text-primary">
                {publishRate}%
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-surface-sunken text-text-secondary">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand-primary transition-[width] duration-500"
              style={{ width: `${publishRate}%` }}
            />
          </div>
          <p className="mt-3 text-body-sm text-text-muted">
            {formatCount(publishedPortfolios)} of {formatCount(totalPortfolios)}{" "}
            portfolios are live
          </p>
        </section>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-border-default p-5 shadow-[var(--shadow-card)]",
        accent ? "bg-brand-light/60" : "bg-surface-raised",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-label uppercase text-text-secondary">{label}</p>
        <Icon
          className={cn(
            "h-4 w-4",
            accent ? "text-brand-primary" : "text-text-muted",
          )}
          aria-hidden
        />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-text-primary">
        {value}
      </p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
