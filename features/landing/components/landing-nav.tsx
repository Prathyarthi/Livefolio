"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const CANDIDATE_LINKS = [
  { label: "How it works", href: "/#features" },
  { label: "Integrations", href: "/#integrations" },
  { label: "Templates", href: "/#showcase" },
  { label: "Pricing", href: "/#pricing" },
  // { label: "Hiring", href: "/recruiters" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

/** Inline desktop links — kept short to fit max-w-3xl (~768px) without overlap. */
const CANDIDATE_PILL_LINKS = [
  { label: "How it works", href: "/#features" },
  { label: "Templates", href: "/#showcase" },
  { label: "Pricing", href: "/#pricing" },
];

const CANDIDATE_PILL_MENU_LINKS = [
  { label: "How it works", href: "/#features" },
  { label: "Integrations", href: "/#integrations" },
  { label: "Templates", href: "/#showcase" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

/** Short inline links for recruiter studio pill (~768px). */
const RECRUITER_PILL_LINKS = [
  { label: "How we rank", href: "#how-we-rank" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const RECRUITER_PILL_MENU_LINKS = [
  { label: "How we rank", href: "#how-we-rank" },
  { label: "References", href: "#references" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "For candidates", href: "/" },
];

const RECRUITER_LINKS = [
  { label: "How we rank", href: "#how-we-rank" },
  { label: "References", href: "#references" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "For candidates", href: "/" },
];

type LandingNavProps = {
  variant?: "candidate" | "recruiter";
  /**
   * `bar` keeps the existing sticky full-width nav (recruiters + marketing pages).
   * `pill` is the studio floating nav used only on the candidate home landing.
   */
  layout?: "bar" | "pill";
};

export function LandingNav({
  variant = "candidate",
  layout = "bar",
}: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const links =
    layout === "pill"
      ? variant === "recruiter"
        ? RECRUITER_PILL_LINKS
        : CANDIDATE_PILL_LINKS
      : variant === "recruiter"
        ? RECRUITER_LINKS
        : CANDIDATE_LINKS;

  const primaryHref = authenticated
    ? variant === "recruiter"
      ? "/company"
      : "/dashboard"
    : variant === "recruiter"
      ? "/sign-up?callbackUrl=%2Fcompany"
      : "/sign-up";
  const primaryLabel = authenticated
    ? variant === "recruiter"
      ? "Open workspace"
      : "Dashboard"
    : variant === "recruiter"
      ? "Start hiring"
      : "Get started free";
  const primaryLabelShort = authenticated
    ? variant === "recruiter"
      ? "Workspace"
      : "Dashboard"
    : variant === "recruiter"
      ? "Start hiring"
      : "Get started";

  if (layout === "pill") {
    const menuLinks =
      variant === "recruiter" ? RECRUITER_PILL_MENU_LINKS : CANDIDATE_PILL_MENU_LINKS;
    return (
      <header className="sticky top-0 z-[100] px-4 pt-3 md:px-0 md:pt-5">
        {/*
          max-w-3xl (~768px) matches reference nav width.
          Slimmer padding / ~16px radius to match studio floating bar.
        */}
        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-2 overflow-hidden rounded-2xl border border-border-default bg-surface-raised/95 px-2.5 py-1.5 shadow-[var(--shadow-card)] backdrop-blur-md supports-backdrop-filter:bg-surface-raised/85 dark:bg-surface-raised/90 sm:gap-3 sm:px-3.5">
          <div className="relative z-[1] flex shrink-0 items-center lg:min-w-[9rem]">
            <Logo
              className="shrink-0 gap-1.5 [&_img]:h-7 [&_img]:w-7"
              wordmarkClassName="text-brand-primary font-sans text-[15px] font-semibold tracking-[-0.02em] sm:text-[16px]"
            />
          </div>

          <nav
            className="absolute left-1/2 top-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 lg:flex"
            aria-label="Main navigation"
          >
            {links.map(({ label, href }, index) => (
              <div key={label} className="flex items-center gap-3">
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="size-1 shrink-0 rounded-full bg-brand-secondary/80"
                  />
                ) : null}
                <Link
                  href={href}
                  className="whitespace-nowrap font-sans text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
                >
                  {label}
                </Link>
              </div>
            ))}
          </nav>

          <div className="relative z-[1] flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-1.5 lg:min-w-[9rem]">
            <ThemeToggle className="hidden shrink-0 lg:inline-flex" />
            {!authenticated ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden h-7 shrink-0 rounded-full px-2.5 text-[13px] md:inline-flex"
              >
                <Link href="/sign-in">Sign in</Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              asChild
              className="hidden h-7 shrink-0 rounded-full px-3 text-[13px] sm:inline-flex"
              variant="accent"
            >
              <Link href={primaryHref}>{primaryLabelShort}</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mx-auto mt-2 w-full max-w-3xl overflow-hidden rounded-2xl border border-border-default bg-surface-raised shadow-[var(--shadow-card)] transition-[max-height,opacity] duration-200 ease-[var(--ease-out)] lg:hidden",
            open ? "max-h-[32rem] opacity-100" : "max-h-0 border-0 opacity-0",
          )}
        >
          <nav
            className="flex flex-col gap-1 px-3 py-3"
            aria-label="Mobile navigation"
          >
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Menu
              </span>
              <ThemeToggle />
            </div>
            {menuLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {!authenticated ? (
                <Button variant="outline" asChild className="w-full rounded-full">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              ) : null}
              <Button asChild className="w-full rounded-full" variant="accent">
                <Link href={primaryHref} onClick={() => setOpen(false)}>
                  {primaryLabel}
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="glass-nav sticky top-0 z-[100]">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Logo className="shrink-0" />

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 px-2 xl:flex"
          aria-label="Main navigation"
        >
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="whitespace-nowrap rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary xl:px-3 xl:text-[14px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 xl:ml-0 xl:pl-2">
          <ThemeToggle className="hidden shrink-0 xl:inline-flex" />
          {!authenticated ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden shrink-0 sm:inline-flex"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          ) : variant === "recruiter" ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden shrink-0 sm:inline-flex"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : null}
          <Button
            size="sm"
            asChild
            className="hidden h-9 shrink-0 px-3 sm:inline-flex xl:px-4"
            variant="accent"
          >
            <Link href={primaryHref}>
              <span className="hidden 2xl:inline">{primaryLabel}</span>
              <span className="2xl:hidden">{primaryLabelShort}</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border-default glass transition-[max-height] duration-200 ease-[var(--ease-out)] xl:hidden",
          open ? "max-h-[28rem]" : "max-h-0 border-t-0",
        )}
      >
        <nav
          className="flex flex-col gap-1 px-4 py-4 sm:px-6"
          aria-label="Mobile navigation"
        >
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Menu
            </span>
            <ThemeToggle />
          </div>
          {links.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            >
              {label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            {!authenticated ? (
              <Button variant="outline" asChild className="w-full">
                <Link href="/sign-in" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
            ) : variant === "recruiter" ? (
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </Button>
            ) : null}
            <Button asChild className="w-full" variant="accent">
              <Link href={primaryHref} onClick={() => setOpen(false)}>
                {primaryLabel}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
