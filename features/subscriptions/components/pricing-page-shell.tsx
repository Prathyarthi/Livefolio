"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PricingPlansSection } from "./pricing-plans-section";
import { Logo } from "@/components/logo";

export function PricingPageShell() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-base">
      <header
        className="sticky top-0 z-[100] border-b border-border-default"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-surface-base) 90%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
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

      <div className="min-h-[calc(100vh-4rem)] px-6 py-[var(--space-9)]">
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
                <Link href={session?.user ? "/dashboard" : "/sign-up"}>
                  {session?.user ? "Go to dashboard" : "Start free"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
