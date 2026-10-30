"use client";

import Link from "next/link";
import { EDIT_FORM_STACK_CLASS } from "@/features/dashboard/constants/form-layout";
import { AskReferenceForm } from "@/features/vouches/components/ask-reference-form";
import { NamedReferences } from "@/features/vouches/components/named-references";
import { useVouches } from "@/features/vouches/api/use-vouches";
import { isVouchRelationship } from "@/features/vouches/lib/validation";
import type { NamedVouch } from "@/features/vouches/lib/public";

export function EditReferencesSection() {
  const { data, isLoading } = useVouches();
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

  return (
    <div className={EDIT_FORM_STACK_CLASS}>
      <p className="text-body-sm text-text-secondary">
        Recruiters see these when they review you. They are not shown on your
        public Livefolio.{" "}
        <Link href="/dashboard/references" className="text-brand-primary hover:underline">
          Manage requests
        </Link>
      </p>
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
