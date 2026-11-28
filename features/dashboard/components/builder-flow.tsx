"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "Upload resume",
    href: "/dashboard",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "Personalize",
    href: "/dashboard/edit",
    match: (pathname: string) => pathname.startsWith("/dashboard/edit"),
  },
  {
    label: "Choose a design",
    href: "/dashboard/templates",
    match: (pathname: string) => pathname.startsWith("/dashboard/templates"),
  },
  {
    label: "Publish",
    href: "/dashboard/preview",
    match: (pathname: string) => pathname.startsWith("/dashboard/preview"),
  },
] as const;

export function BuilderFlow({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = Math.max(
    0,
    STEPS.findIndex((step) => step.match(pathname))
  );

  return (
    <nav aria-label="Portfolio flow" className={cn("w-full", className)}>
      <ol className="flex min-w-[40rem] items-center">
        {STEPS.map((step, index) => {
          const state =
            index < current ? "complete" : index === current ? "active" : "upcoming";
          const isLast = index === STEPS.length - 1;

          return (
            <li
              key={step.href}
              className={cn("flex min-w-0 items-center", !isLast && "flex-1")}
              aria-current={state === "active" ? "step" : undefined}
            >
              <Link
                href={step.href}
                className="flex shrink-0 items-center gap-2.5 rounded-full outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums",
                    state === "upcoming"
                      ? "bg-[#e4e0d8] text-[#aea9a0] dark:bg-[#2c2a26] dark:text-[#7d756c]"
                      : "bg-[#1a1828] text-white dark:bg-[#f4f1ea] dark:text-[#1a1828]"
                  )}
                >
                  {state === "complete" ? (
                    <Check className="size-3.5" strokeWidth={2.75} aria-hidden />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    state === "active" && "font-semibold text-text-primary",
                    state === "complete" && "font-medium text-text-primary",
                    state === "upcoming" &&
                      "font-medium text-[#b7b3aa] dark:text-text-muted"
                  )}
                >
                  {step.label}
                </span>
              </Link>
              {!isLast ? (
                <span
                  className="mx-3 h-px min-w-6 flex-1 bg-[#ddd8ce] dark:bg-border-default"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
