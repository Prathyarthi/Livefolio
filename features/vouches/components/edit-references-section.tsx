"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EDIT_FORM_STACK_CLASS } from "@/features/dashboard/constants/form-layout";
import { AskReferenceForm } from "@/features/vouches/components/ask-reference-form";
import { NamedReferences } from "@/features/vouches/components/named-references";
import { useVouches } from "@/features/vouches/api/use-vouches";
import { isVouchRelationship } from "@/features/vouches/lib/validation";
import type { NamedVouch } from "@/features/vouches/lib/public";

export function EditReferencesSection() {
  const { data, isLoading } = useVouches();
  const pendingCount = (data?.asked ?? []).filter(
    (row) => row.status === "pending",
  ).length;
  const askedCount = data?.asked.length ?? 0;
  const incomingCount = data?.incoming.length ?? 0;
  const vouches: NamedVouch[] = (data?.asked ?? []).flatMap((row) => {
    if (
      row.status !== "completed" ||
      !row.story ||
      !row.referee ||
      !isVouchRelationship(row.relationship)
    ) {
      return [];
    }
    return [
      {
        id: row.id,
        relationship: row.relationship,
        relationshipLabel: row.relationshipLabel ?? "Collaborator",
        story: row.story,
        completedAt: row.completedAt ?? row.createdAt,
        referee: row.referee,
      },
    ];
  });

  const counts = [
    pendingCount > 0
      ? `${pendingCount} waiting`
      : askedCount > 0
        ? `${askedCount} asked`
        : null,
    incomingCount > 0 ? `${incomingCount} asked of you` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const statusLine = isLoading
    ? "Loading your asks…"
    : counts
      ? `${counts} · resend, copy, or cancel`
      : "Resend, copy, or cancel asks";

  return (
    <div className={EDIT_FORM_STACK_CLASS}>
      <p className="text-body-sm text-text-secondary">
        Recruiters see these when they review you. They are not shown on your
        public Livefolio.
      </p>
      <Link
        href="/dashboard/references"
        className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-sunken/60"
      >
        <span className="min-w-0">
          <span className="block font-medium text-text-primary">
            Manage requests
          </span>
          <span className="mt-0.5 block text-body-sm text-text-secondary">
            {statusLine}
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-text-muted"
          aria-hidden
        />
      </Link>
      {isLoading ? (
        <p className="text-body-sm text-text-muted">Loading references…</p>
      ) : (
        <NamedReferences
          vouches={vouches}
          title="Who has vouched"
          empty={
            <p className="text-body-sm text-text-secondary">
              No named references yet. Ask people who have actually worked with
              you.
            </p>
          }
        />
      )}
      <AskReferenceForm limits={data?.limits} />
    </div>
  );
}
