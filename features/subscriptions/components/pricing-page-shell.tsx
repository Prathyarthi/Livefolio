"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PricingPlansSection } from "./pricing-plans-section";
import { Logo } from "@/components/logo";
import { LandingNav } from "@/features/landing/components/landing-nav";

export function PricingPageShell({
  audience = "candidate",
}: {
  audience?: "candidate" | "recruiter";
}) {
  const { data: session } = useSession();
  const hiring = audience === "recruiter";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden bg-surface-base">
      {hiring ? (
        <LandingNav variant="recruiter" />
      ) : (
        <header className="glass-nav sticky top-0 z-[100]">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
            <Logo />

            <nav className="flex items-center gap-1.5">
              <ThemeToggle />
              {session?.user ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button size="sm" asChild className="h-9 px-4">
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <div className="px-6 py-[var(--space-9)]">
        {hiring ? (
          <div className="mx-auto mb-10 max-w-4xl rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
            <p className="eyebrow uppercase">Hiring</p>
            <h2 className="mt-2 text-h3 text-text-primary">
              This page is personal Livefolio Pro
            </h2>
            <p className="mt-2 max-w-2xl text-body-sm text-text-secondary">
              Org Pro for open jobs and workspaces lives on the recruiters page.
              The plans below are for individual portfolios.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/recruiters#pricing">View Org Pro</Link>
            </Button>
          </div>
        ) : null}

        <PricingPlansSection />

        <div className="mx-auto mt-12 max-w-4xl">
          <Card>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-h3 text-text-primary">Why only two plans?</h2>
                <p className="mt-2 text-body-sm text-text-secondary">
                  Starter gives you one free month with full workflow access, then
                  keeps core publishing on Minimal. Pro is for job-search seasons
                  when you want premium templates, resume import, and faster
                  support. We will keep the lineup this simple until usage tells us
                  we need more.
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link
                  href={
                    hiring
                      ? "/recruiters#pricing"
                      : session?.user
                        ? "/dashboard"
                        : "/sign-up"
                  }
                >
                  {hiring
                    ? "View Org Pro"
                    : session?.user
                      ? "Go to dashboard"
                      : "Start free"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
