"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import type { NamedVouch } from "@/features/vouches/lib/public";

export function NamedReferences({
  vouches,
  title = "Named references",
  description,
  empty,
}: {
  vouches: NamedVouch[];
  title?: string;
  description?: string;
  empty?: ReactNode;
}) {
  if (vouches.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-h3 text-text-primary">{title}</h2>
        {description ? (
          <p className="mt-1 text-body-sm text-text-secondary">{description}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        {vouches.map((vouch) => (
          <article
            key={vouch.id}
            className="rounded-[var(--radius-md)] border border-border-default bg-surface-base p-4"
          >
            <div className="flex items-start gap-3">
              <Avatar>
                {vouch.referee.avatarUrl ? (
                  <AvatarImage src={vouch.referee.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {vouch.referee.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-text-primary">
                  {vouch.referee.name}
                </p>
                <p className="text-xs text-text-muted">
                  {vouch.relationshipLabel}
                </p>
              </div>
            </div>
            <p className="mt-3 text-body-sm text-text-primary">
              “{vouch.story}”
            </p>
            {vouch.referee.portfolioUrl ? (
              <Link
                href={vouch.referee.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-brand-primary hover:underline"
              >
                View their Livefolio
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
