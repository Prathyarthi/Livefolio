"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

type FlowAction = {
  href?: string;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

type FlowFooterProps = {
  previous?: FlowAction;
  next?: FlowAction;
  className?: string;
  /** Short hint shown between the nav actions; omit for none. */
  message?: string | null;
  /** Pin navigation above content (`top`) or below (`bottom`, default). */
  placement?: "top" | "bottom";
  /** Extra actions rendered on the right beside previous/next (e.g. import CTA). */
  actions?: ReactNode;
};

function FlowNavButton({
  action,
  direction,
}: {
  action: FlowAction;
  direction: "previous" | "next";
}) {
  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ArrowLeft : ArrowRight;
  const content = (
    <>
      {isPrevious ? <Icon /> : null}
      {action.label}
      {isPrevious ? null : <Icon />}
    </>
  );

  if (action.href) {
    return (
      <Button
        variant={isPrevious ? "ghost" : "default"}
        size="sm"
        className="shrink-0"
        asChild
        disabled={action.disabled}
      >
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant={isPrevious ? "ghost" : "default"}
      size="sm"
      className="shrink-0"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {content}
    </Button>
  );
}

export function FlowFooter({
  previous,
  next,
  className,
  message = null,
  placement = "bottom",
  actions,
}: FlowFooterProps) {
  const edgeClass =
    placement === "top"
      ? "border-b border-border-default pb-4"
      : "border-t border-border-default pt-5";

  return (
    <nav
      aria-label="Portfolio flow"
      className={cn("flex flex-col gap-2", edgeClass, className)}
    >
      {message ? (
        <p className="text-body-sm text-text-muted sm:hidden">{message}</p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center">
          {previous ? (
            <FlowNavButton action={previous} direction="previous" />
          ) : null}
        </div>

        {message ? (
          <p className="hidden min-w-0 flex-1 truncate text-center text-body-sm text-text-muted sm:block">
            {message}
          </p>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {next ? <FlowNavButton action={next} direction="next" /> : null}
        </div>
      </div>
    </nav>
  );
}
