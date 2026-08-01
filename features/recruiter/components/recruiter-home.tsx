"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useRecruiterCandidates,
  useUploadResumeDossier,
} from "@/features/recruiter/api/use-candidates";
import { useRecruiterOrg } from "@/features/recruiter/api/use-org";
import { CreateOrgGate } from "@/features/recruiter/components/create-org-gate";

export function RecruiterHome() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: orgData, isLoading: orgLoading } = useRecruiterOrg();
  const { data: candidatesData, isLoading: candidatesLoading } =
    useRecruiterCandidates("active");
  const upload = useUploadResumeDossier();

  if (orgLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!orgData?.org) {
    return <CreateOrgGate />;
  }

  const candidates = candidatesData?.candidates ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm text-text-muted">{orgData.org.name}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-text-primary">
          Recruiter home
        </h1>
        <p className="mt-2 max-w-2xl text-body text-text-secondary">
          Upload a resume to build a verification dossier, or search your pool
          with a job description or natural language.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileUp className="h-5 w-5" />
              Upload resume
            </CardTitle>
            <CardDescription>
              Parse structured profile data and auto-enrich any supported
              connected sources found on the resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                upload.mutate(file, {
                  onSuccess: (data) => {
                    toast.success("Dossier ready");
                    router.push(`/recruiter/candidates/${data.candidateId}`);
                  },
                  onError: (err) => toast.error(err.message),
                });
                e.target.value = "";
              }}
            />
            <Button
              disabled={upload.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {upload.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing & enriching…
                </>
              ) : (
                "Choose PDF"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Search talent
            </CardTitle>
            <CardDescription>
              Match on skills and experience first. Living-proof filters apply
              when connected sources exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/recruiter/search">Open search</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Recent candidates
          </h2>
          <Badge variant="secondary">{candidates.length} active</Badge>
        </div>

        {candidatesLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-text-secondary">
              <UserRound className="mx-auto mb-3 h-8 w-8 text-text-muted" />
              <p>No dossiers yet. Upload a resume to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-border-default rounded-lg border border-border-default bg-surface-base">
            {candidates.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/recruiter/candidates/${c.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface-sunken"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {c.displayName || "Candidate"}
                    </p>
                    <p className="truncate text-sm text-text-muted">
                      {c.headline || c.source}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {c.socialProfiles.slice(0, 4).map((s) => (
                      <Badge key={s.platform} variant="outline">
                        {s.platform}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
