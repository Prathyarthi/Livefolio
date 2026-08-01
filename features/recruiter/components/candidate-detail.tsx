"use client";

import { useState } from "react";
import Link from "next/link";
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

export function CandidateDetail({ id }: { id: string }) {
  const { data: orgData, isLoading: orgLoading } = useRecruiterOrg();
  const { data, isLoading } = useRecruiterCandidate(id);
  const patch = usePatchCandidate(id);
  const addNote = useAddCandidateNote(id);
  const [note, setNote] = useState("");

  if (orgLoading || isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!orgData?.org) return <CreateOrgGate />;
  if (!data?.candidate) {
    return (
      <div className="space-y-4">
        <p>Candidate not found.</p>
        <Button asChild variant="secondary">
          <Link href="/recruiter">Back</Link>
        </Button>
      </div>
    );
  }

  const c = data.candidate;

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
          <CardHeader>
            <CardTitle className="text-base">Scorecard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Overall score</Label>
              <Select
                value={c.overallScore != null ? String(c.overallScore) : "none"}
                onValueChange={(v) => {
                  patch.mutate(
                    { overallScore: v === "none" ? null : Number(v) },
                    {
                      onSuccess: () => toast.success("Score saved"),
                      onError: (e) => toast.error(e.message),
                    }
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not scored</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / 5
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <Select
                value={c.recommendation ?? "none"}
                onValueChange={(v) => {
                  patch.mutate(
                    { recommendation: v === "none" ? null : v },
                    {
                      onSuccess: () => toast.success("Recommendation saved"),
                      onError: (e) => toast.error(e.message),
                    }
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="strong_yes">Strong yes</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="no">No</SelectItem>
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
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                patch.mutate(
                  { status: "archived" },
                  {
                    onSuccess: () => toast.success("Archived"),
                    onError: (e) => toast.error(e.message),
                  }
                );
              }}
            >
              Archive
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
