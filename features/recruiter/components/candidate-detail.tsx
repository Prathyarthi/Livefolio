"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAddCandidateNote,
  usePatchCandidate,
  useRecruiterCandidate,
} from "@/features/recruiter/api/use-candidates";
import { useRecruiterOrg } from "@/features/recruiter/api/use-org";
import { CreateOrgGate } from "@/features/recruiter/components/create-org-gate";
import { RecruiterBrief } from "@/features/recruiter/components/recruiter-brief";

const SCORE_NONE = "none";
const RECOMMENDATION_NONE = "none";

const RECOMMENDATION_OPTIONS = [
  { value: "strong_yes", label: "Strong yes" },
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
] as const;

type RecommendationValue =
  | (typeof RECOMMENDATION_OPTIONS)[number]["value"]
  | typeof RECOMMENDATION_NONE;

function scoreToSelectValue(score: number | null | undefined) {
  return score != null ? String(score) : SCORE_NONE;
}

function recommendationToSelectValue(
  recommendation: string | null | undefined,
): RecommendationValue {
  if (
    recommendation === "strong_yes" ||
    recommendation === "yes" ||
    recommendation === "maybe" ||
    recommendation === "no"
  ) {
    return recommendation;
  }
  return RECOMMENDATION_NONE;
}

export function CandidateDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: orgData, isLoading: orgLoading } = useRecruiterOrg();
  const { data, isLoading } = useRecruiterCandidate(id);
  const patch = usePatchCandidate(id);
  const addNote = useAddCandidateNote(id);
  const [note, setNote] = useState("");
  const [scoreValue, setScoreValue] = useState(SCORE_NONE);
  const [recommendationValue, setRecommendationValue] =
    useState<RecommendationValue>(RECOMMENDATION_NONE);
  const [status, setStatus] = useState("active");

  const candidate = data?.candidate;

  useEffect(() => {
    if (!candidate) return;
    setScoreValue(scoreToSelectValue(candidate.overallScore));
    setRecommendationValue(
      recommendationToSelectValue(candidate.recommendation),
    );
    setStatus(candidate.status);
  }, [
    candidate?.id,
    candidate?.overallScore,
    candidate?.recommendation,
    candidate?.status,
  ]);

  if (orgLoading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!orgData?.org) return <CreateOrgGate />;
  if (!candidate) {
    return (
      <div className="space-y-4">
        <p>Candidate not found.</p>
        <Button asChild variant="secondary">
          <Link href="/recruiter">Back</Link>
        </Button>
      </div>
    );
  }

  const c = candidate;
  const isArchived = status === "archived";
  const controlsDisabled = patch.isPending;

  const saveScore = (next: string) => {
    const previous = scoreValue;
    setScoreValue(next);
    patch.mutate(
      { overallScore: next === SCORE_NONE ? null : Number(next) },
      {
        onSuccess: () => toast.success("Score saved"),
        onError: (e) => {
          setScoreValue(previous);
          toast.error(e.message);
        },
      },
    );
  };

  const saveRecommendation = (next: RecommendationValue) => {
    const previous = recommendationValue;
    setRecommendationValue(next);
    patch.mutate(
      { recommendation: next === RECOMMENDATION_NONE ? null : next },
      {
        onSuccess: () => toast.success("Recommendation saved"),
        onError: (e) => {
          setRecommendationValue(previous);
          toast.error(e.message);
        },
      },
    );
  };

  const toggleArchive = () => {
    const nextStatus = isArchived ? "active" : "archived";
    const previous = status;
    setStatus(nextStatus);
    patch.mutate(
      { status: nextStatus },
      {
        onSuccess: () => {
          toast.success(isArchived ? "Restored to active" : "Archived");
          if (nextStatus === "archived") {
            router.push("/recruiter");
          }
        },
        onError: (e) => {
          setStatus(previous);
          toast.error(e.message);
        },
      },
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/recruiter">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <RecruiterBrief
          displayName={c.displayName}
          headline={c.headline}
          summary={c.summary}
          source={c.source}
          email={c.email}
          socialProfiles={c.socialProfiles}
          projects={c.projects}
          parsed={c.parsedJson}
          claimsVsProof={data.claimsVsProof}
        />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Scorecard</CardTitle>
            <p className="text-xs text-text-muted">
              Score and recommendation save as soon as you change them.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isArchived ? (
              <p className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-xs text-text-muted">
                This candidate is archived.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="scorecard-score">Overall score</Label>
              <Select
                value={scoreValue}
                onValueChange={saveScore}
                disabled={controlsDisabled}
              >
                <SelectTrigger id="scorecard-score" className="w-full">
                  <SelectValue placeholder="Select score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SCORE_NONE}>Not scored</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / 5
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scorecard-recommendation">Recommendation</Label>
              <Select
                value={recommendationValue}
                onValueChange={(v) =>
                  saveRecommendation(v as RecommendationValue)
                }
                disabled={controlsDisabled}
              >
                <SelectTrigger id="scorecard-recommendation" className="w-full">
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RECOMMENDATION_NONE}>None</SelectItem>
                  {RECOMMENDATION_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {c.portfolio?.slug ? (
              <Button asChild variant="outline" className="w-full">
                <a
                  href={`https://${c.portfolio.slug}.livefolio.me`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open public folio
                </a>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Candidate status</CardTitle>
            <p className="text-xs text-text-muted">
              {isArchived
                ? "Restore to show this person in your active pool again."
                : "Archive removes them from the active pool. Scoring is unchanged."}
            </p>
          </CardHeader>
          <CardContent>
            <Button
              variant={isArchived ? "secondary" : "outline"}
              className="w-full"
              disabled={controlsDisabled}
              onClick={toggleArchive}
            >
              {patch.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isArchived ? (
                "Restore to active"
              ) : (
                "Archive candidate"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Private team notes…"
              rows={4}
            />
            <Button
              disabled={!note.trim() || addNote.isPending}
              onClick={() => {
                addNote.mutate(note.trim(), {
                  onSuccess: () => {
                    setNote("");
                    toast.success("Note added");
                  },
                  onError: (e) => toast.error(e.message),
                });
              }}
            >
              {addNote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add note"
              )}
            </Button>
            <ul className="space-y-3">
              {c.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-border-default px-3 py-2 text-sm"
                >
                  <p className="whitespace-pre-wrap text-text-primary">{n.body}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {n.author.name} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
