"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useApplicationPreview,
  useSubmitApplication,
} from "@/features/applications/api/use-applications";

export default function ApplyJobPage() {
  const params = useParams<{ jobSlug: string }>();
  const jobSlug = params.jobSlug;
  const router = useRouter();
  const { status } = useSession();
  const { data, isLoading, error, refetch } = useApplicationPreview(jobSlug);
  const submit = useSubmitApplication(jobSlug);
  const [coverNote, setCoverNote] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${jobSlug}/apply`)}`,
      );
    }
  }, [status, router, jobSlug]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const noPortfolio =
    error instanceof Error &&
    ((error as Error & { code?: string }).code === "NO_PORTFOLIO" ||
      error.message.toLowerCase().includes("livefolio"));

  if (noPortfolio) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-h2 text-text-primary">Create your Livefolio first</h1>
        <p className="text-body-sm text-text-secondary">
          You need a professional profile before applying. Import a resume or
          fill in the basics — you can refine it later.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/import">Import resume</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-h2 text-text-primary">Unable to apply</h1>
        <p className="text-body-sm text-text-secondary">
          {error instanceof Error
            ? error.message
            : "This job may be closed or unavailable."}
        </p>
        <Button asChild variant="outline">
          <Link href={`/jobs/${jobSlug}`}>Back to job</Link>
        </Button>
      </div>
    );
  }

  if (data.alreadyApplied && data.existingApplication) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-h2 text-text-primary">Already applied</h1>
        <p className="text-body-sm text-text-secondary">
          You submitted an application for {data.job.title} at{" "}
          {data.job.organization.name}.
        </p>
        <Button asChild>
          <Link href={`/dashboard/applications/${data.existingApplication.id}`}>
            View application
          </Link>
        </Button>
      </div>
    );
  }

  const snapshot = data.snapshot;
  const profile = snapshot.profile;

  async function handleSubmit() {
    try {
      const application = await submit.mutateAsync({
        coverNote: coverNote.trim() || undefined,
      });
      toast.success("Application submitted");
      router.push(`/dashboard/applications/${application.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit application",
      );
      void refetch();
    }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-6 py-10 md:py-14">
        <header className="space-y-2">
          <p className="eyebrow uppercase">Review your application</p>
          <h1 className="text-h2 text-text-primary">{data.job.title}</h1>
          <p className="text-body-sm text-text-secondary">
            Applying to {data.job.organization.name}. We&apos;ll create an
            immutable snapshot of your Livefolio at submit time.
          </p>
        </header>

        <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6">
          <p className="text-label uppercase text-text-secondary">
            What will be shared
          </p>
          <div className="mt-4 flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>
                {(profile.title || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h2 className="text-h3 text-text-primary">
                {profile.title || "Your Livefolio"}
              </h2>
              {profile.headline ? (
                <p className="text-body-sm text-text-secondary">
                  {profile.headline}
                </p>
              ) : null}
              {profile.location ? (
                <p className="text-body-sm text-text-muted">{profile.location}</p>
              ) : null}
            </div>
          </div>

          {profile.summary ? (
            <p className="mt-4 whitespace-pre-wrap text-body-sm text-text-secondary">
              {profile.summary}
            </p>
          ) : null}

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <SnapshotList
              title="Experience"
              items={snapshot.experiences.map(
                (e) => `${e.role} · ${e.company}`,
              )}
            />
            <SnapshotList
              title="Skills"
              items={snapshot.skills.map((s) => s.name)}
            />
            <SnapshotList
              title="Projects"
              items={snapshot.projects.map((p) => p.title)}
            />
            <SnapshotList
              title="Education"
              items={snapshot.educations.map(
                (e) => `${e.degree} · ${e.institution}`,
              )}
            />
            <SnapshotList
              title="Certifications"
              items={snapshot.certifications.map((c) => c.name)}
            />
            <SnapshotList
              title="Achievements"
              items={snapshot.achievements.map((a) => a.title)}
            />
          </div>
        </section>

        <div className="space-y-2">
          <Label htmlFor="cover">Note to hiring team (optional)</Label>
          <Textarea
            id="cover"
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            rows={4}
            placeholder="Anything you want this company to know about this application."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSubmit} disabled={submit.isPending} size="lg">
            {submit.isPending ? "Submitting…" : "Submit application"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/edit">Edit Livefolio</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/jobs/${jobSlug}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SnapshotList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-label uppercase text-text-secondary">{title}</h3>
      <ul className="space-y-1 text-body-sm text-text-primary">
        {items.slice(0, 6).map((item) => (
          <li key={item} className="truncate">
            {item}
          </li>
        ))}
        {items.length > 6 ? (
          <li className="text-text-muted">+{items.length - 6} more</li>
        ) : null}
      </ul>
    </div>
  );
}