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
import { RichText } from "@/components/rich-text";
import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { OrgLogo } from "@/features/organization/components/org-logo";
import {
  useApplicationPreview,
  useSubmitApplication,
} from "@/features/applications/api/use-applications";
import { SharedSnapshotPreview } from "@/features/applications/components/shared-snapshot-preview";
import { ScreeningQuestionsDrawer } from "@/features/applications/components/screening-questions-drawer";
import {
  unansweredRequiredQuestions,
  type ScreeningAnswerInput,
} from "@/features/jobs/lib/screening-questions";

export default function ApplyJobPage() {
  const params = useParams<{ jobSlug: string }>();
  const jobSlug = params.jobSlug;
  const router = useRouter();
  const { status } = useSession();
  const { data, isLoading, error, refetch } = useApplicationPreview(jobSlug);
  const submit = useSubmitApplication(jobSlug);
  const [coverNote, setCoverNote] = useState("");
  const [screeningAnswers, setScreeningAnswers] = useState<
    ScreeningAnswerInput[]
  >([]);
  const [questionsOpen, setQuestionsOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${jobSlug}/apply`)}`,
      );
    }
  }, [status, router, jobSlug]);

  useEffect(() => {
    if ((data?.job.screeningQuestions?.length ?? 0) > 0) {
      setQuestionsOpen(true);
    }
  }, [data?.job.screeningQuestions?.length]);

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
          You submitted an application for{" "}
          <RichText as="span" text={data.job.title} /> at{" "}
          <RichText as="span" text={data.job.organization.name} />.
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
  const screeningQuestions = data.job.screeningQuestions ?? [];
  const companyName = data.job.organization.name;

  async function handleSubmit() {
    const missing = unansweredRequiredQuestions(
      screeningQuestions,
      screeningAnswers,
    );
    if (missing.length > 0) {
      setQuestionsOpen(true);
      toast.error(`Please answer: ${missing[0]?.prompt}`);
      return;
    }
    try {
      const application = await submit.mutateAsync({
        coverNote: coverNote.trim() || undefined,
        screeningAnswers,
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
      <header className="sticky top-0 z-20 border-b border-border-default bg-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-brand-primary">
              {siteConfig.name}
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/jobs/${jobSlug}`}>Back to job</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 md:py-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
        <div className="contents lg:sticky lg:top-24 lg:block lg:space-y-8">
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <CompanyMark
                name={companyName}
                logoUrl={data.job.organization.logoUrl}
              />
              <div className="min-w-0">
                <p className="eyebrow uppercase">Applying to</p>
                <p className="truncate font-medium text-text-primary">
                  <RichText as="span" text={companyName} />
                </p>
              </div>
            </div>
            <h1 className="break-words text-h2 text-text-primary">
              <RichText as="span" text={data.job.title} />
            </h1>
            <p className="text-body-sm text-text-secondary">
              <RichText as="span" text={companyName} /> receives this copy of
              your Livefolio when you submit. Later edits to your profile will
              not change this application.
            </p>
          </header>

          <div className="order-3 space-y-8 lg:order-none">
            <div className="space-y-2">
              <Label htmlFor="cover">Note to the hiring team</Label>
              <p className="text-xs text-text-muted">
                Optional. Only this company sees it.
              </p>
              <Textarea
                id="cover"
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={4}
                placeholder="Anything you want them to know about this application."
              />
            </div>

            {screeningQuestions.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4">
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    A few questions from the hiring team
                  </p>
                  <p className="text-xs text-text-muted">
                    Answer these before you submit.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuestionsOpen(true)}
                >
                  Answer questions
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleSubmit}
                disabled={submit.isPending}
                size="lg"
              >
                {submit.isPending ? "Submitting…" : "Submit application"}
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/jobs/${jobSlug}`}>Cancel</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="order-2 min-w-0 lg:order-none">
          <SharedSnapshotPreview snapshot={snapshot} companyName={companyName} />
        </div>
      </div>

      <ScreeningQuestionsDrawer
        open={questionsOpen}
        onOpenChange={setQuestionsOpen}
        questions={screeningQuestions}
        answers={screeningAnswers}
        onAnswersChange={setScreeningAnswers}
      />
    </div>
  );
}

function CompanyMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return <OrgLogo name={name} logoUrl={logoUrl} size="md" />;
  }
  const letter =
    stripRichTextToPlain(name).trim().slice(0, 1).toUpperCase() || "•";
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-sunken font-display text-sm font-bold text-text-secondary">
      {letter}
    </div>
  );
}