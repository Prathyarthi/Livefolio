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
  { label: "Hiring", href: "/recruiters" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

const RECRUITER_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Livefolio", href: "#why-livefolio" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "For candidates", href: "/" },
];

type LandingNavProps = {
  variant?: "candidate" | "recruiter";
};

export function LandingNav({ variant = "candidate" }: LandingNavProps) {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const links = variant === "recruiter" ? RECRUITER_LINKS : CANDIDATE_LINKS;

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
      : "Get started — it's free";
  const primaryLabelShort = authenticated
    ? variant === "recruiter"
      ? "Workspace"
      : "Dashboard"
    : variant === "recruiter"
      ? "Start hiring"
      : "Get started";

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
          ) : (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden shrink-0 sm:inline-flex"
            >
              <Link href="/recruiters">Hiring</Link>
            </Button>
          )}
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
            ) : (
              <Button variant="outline" asChild className="w-full">
                <Link href="/recruiters" onClick={() => setOpen(false)}>
                  Hiring
                </Link>
              </Button>
            )}
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
