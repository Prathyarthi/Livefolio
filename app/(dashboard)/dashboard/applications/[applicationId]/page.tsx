"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyApplication } from "@/features/applications/api/use-applications";
import {
  APPLICATION_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
} from "@/features/jobs/constants/labels";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const { data, isLoading, error } = useMyApplication(params.applicationId);

  if (isLoading) {
    return (
      <div className="p-8 text-body-sm text-text-muted">
        Loading application…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-8">
        <h1 className="text-h3 text-text-primary">Application not found</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/applications">Back to applications</Link>
        </Button>
      </div>
    );
  }

  const snapshot = data.snapshot?.data as ApplicationSnapshotData | undefined;
  const profile = snapshot?.profile;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/applications">← Back to applications</Link>
      </Button>
      <header className="space-y-3">
        <Badge variant="neutral">
          {APPLICATION_STATUS_LABELS[data.status] ?? data.status}
        </Badge>
        <h1 className="text-h2 text-text-primary">{data.job.title}</h1>
        <p className="text-body-sm text-text-secondary">
          {formatJobMeta([
            data.job.organization.name,
            data.job.location,
            data.job.employmentType
              ? EMPLOYMENT_TYPE_LABELS[data.job.employmentType]
              : null,
            data.job.workplaceType
              ? WORKPLACE_TYPE_LABELS[data.job.workplaceType]
              : null,
          ])}
        </p>
        <p className="text-body-sm text-text-muted">
          Submitted{" "}
          {new Date(data.submittedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={`/jobs/${data.job.slug}`}>View job</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/applications">All applications</Link>
        </Button>
      </div>

      {data.coverNote ? (
        <section className="space-y-2">
          <h2 className="text-h3 text-text-primary">Your note</h2>
          <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
            {data.coverNote}
          </p>
        </section>
      ) : null}

      {snapshot && profile ? (
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
          <div>
            <p className="text-label uppercase text-text-secondary">
              Submitted profile snapshot
            </p>
            <p className="mt-1 text-xs text-text-muted">
              This is what the company received. Later edits to your Livefolio
              do not change this application.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>
                {(profile.title || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-text-primary">
                {profile.title || "Livefolio"}
              </h3>
              {profile.headline ? (
                <p className="text-body-sm text-text-secondary">
                  {profile.headline}
                </p>
              ) : null}
            </div>
          </div>

          {profile.summary ? (
            <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
              {profile.summary}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <MiniList
              title="Experience"
              items={snapshot.experiences.map(
                (e) => `${e.role} · ${e.company}`,
              )}
            />
            <MiniList
              title="Skills"
              items={snapshot.skills.map((s) => s.name)}
            />
            <MiniList
              title="Projects"
              items={snapshot.projects.map((p) => p.title)}
            />
            <MiniList
              title="Education"
              items={snapshot.educations.map(
                (e) => `${e.degree} · ${e.institution}`,
              )}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-label uppercase text-text-secondary">{title}</h4>
      <ul className="space-y-1 text-body-sm text-text-primary">
        {items.slice(0, 8).map((item) => (
          <li key={item} className="truncate">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
