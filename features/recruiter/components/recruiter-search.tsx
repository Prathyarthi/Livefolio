"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSaveLivefolioHit } from "@/features/recruiter/api/use-candidates";
import { useRecruiterOrg } from "@/features/recruiter/api/use-org";
import { useRecruiterSearch } from "@/features/recruiter/api/use-search";
import { CreateOrgGate } from "@/features/recruiter/components/create-org-gate";
import type { FilterAst, SearchHit } from "@/features/recruiter/types";

export function RecruiterSearch() {
  const router = useRouter();
  const { data: orgData, isLoading: orgLoading } = useRecruiterOrg();
  const search = useRecruiterSearch();
  const saveHit = useSaveLivefolioHit();
  const [jd, setJd] = useState("");
  const [nl, setNl] = useState("");
  const [chips, setChips] = useState<
    Array<{ id: string; label: string; kind: string }>
  >([]);
  const [ast, setAst] = useState<FilterAst>({});
  const [results, setResults] = useState<SearchHit[]>([]);

  if (orgLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!orgData?.org) return <CreateOrgGate />;

  const runSearch = (text: string, inputType: "jd" | "nl") => {
    search.mutate(
      { text, inputType },
      {
        onSuccess: (data) => {
          setAst(data.ast);
          setChips(data.chips);
          setResults(data.results);
          if (data.results.length === 0) {
            toast.message(
              "No matches yet — upload more resumes or widen filters"
            );
          }
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const removeChip = (id: string) => {
    const next: FilterAst = { ...ast };
    if (id.startsWith("skill:")) {
      const skill = id.slice(6);
      next.skills = (next.skills ?? []).filter((s) => s !== skill);
      if (!next.skills.length) delete next.skills;
    } else if (id.startsWith("years:")) {
      delete next.minYears;
    } else if (id.startsWith("title:")) {
      const title = id.slice(6);
      next.titles = (next.titles ?? []).filter((t) => t !== title);
      if (!next.titles?.length) delete next.titles;
    } else if (id.startsWith("kw:")) {
      const kw = id.slice(3);
      next.keywords = (next.keywords ?? []).filter((k) => k !== kw);
      if (!next.keywords?.length) delete next.keywords;
    } else if (id.startsWith("active:")) {
      delete next.activeOnPlatformWithinDays;
    } else if (id.startsWith("stat:")) {
      delete next.minPlatformStat;
    } else if (id === "liveDemo") {
      delete next.requiresLiveDemo;
    } else if (id === "published") {
      delete next.requiresPublishedContent;
    }
    setAst(next);
    setChips((prev) => prev.filter((c) => c.id !== id));
    search.mutate(
      { ast: next, inputType: "filters" },
      {
        onSuccess: (data) => {
          setResults(data.results);
          setChips(data.chips);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          Search talent
        </h1>
        <p className="mt-2 max-w-2xl text-body text-text-secondary">
          Paste a job description or ask in plain language. Results match
          structured profile data first; connected-source filters boost when
          available.
        </p>
      </div>

      <Tabs defaultValue="nl">
        <TabsList>
          <TabsTrigger value="nl">Natural language</TabsTrigger>
          <TabsTrigger value="jd">Job description</TabsTrigger>
        </TabsList>
        <TabsContent value="nl" className="space-y-3">
          <Textarea
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            rows={4}
            placeholder='e.g. "5 years B2B SaaS marketing, strong storytelling, published writing"'
          />
          <Button
            disabled={!nl.trim() || search.isPending}
            onClick={() => runSearch(nl, "nl")}
          >
            {search.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </TabsContent>
        <TabsContent value="jd" className="space-y-3">
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={8}
            placeholder="Paste the full job description…"
          />
          <Button
            disabled={!jd.trim() || search.isPending}
            onClick={() => runSearch(jd, "jd")}
          >
            {search.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                Match JD
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => removeChip(chip.id)}
              className="group"
              title="Remove filter"
            >
              <Badge
                variant={chip.kind === "amplifier" ? "default" : "secondary"}
                className="group-hover:opacity-80"
              >
                {chip.label} ×
              </Badge>
            </button>
          ))}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Results ({results.length})
        </h2>
        {results.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-text-secondary">
              Run a search against your uploaded dossiers and opted-in LiveFolio
              profiles.
            </CardContent>
          </Card>
        ) : (
          results.map((hit) => (
            <Card key={hit.signalId}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">{hit.displayName}</CardTitle>
                  <p className="mt-1 text-sm text-text-secondary">
                    {hit.headline}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline">{hit.corpusType}</Badge>
                    <Badge variant="secondary">score {hit.score}</Badge>
                    {hit.skills.slice(0, 6).map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {hit.candidateId ? (
                    <Button asChild size="sm">
                      <Link href={`/recruiter/candidates/${hit.candidateId}`}>
                        Open dossier
                      </Link>
                    </Button>
                  ) : hit.portfolioId ? (
                    <Button
                      size="sm"
                      disabled={saveHit.isPending}
                      onClick={() => {
                        saveHit.mutate(
                          { portfolioId: hit.portfolioId! },
                          {
                            onSuccess: (data) => {
                              toast.success("Saved to shortlist");
                              router.push(
                                `/recruiter/candidates/${data.candidateId}`
                              );
                            },
                            onError: (e) => toast.error(e.message),
                          }
                        );
                      }}
                    >
                      Save & open
                    </Button>
                  ) : null}
                  {hit.slug ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://${hit.slug}.livefolio.me`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Public folio
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc text-sm text-text-secondary">
                  {hit.reasons.map((r, i) => (
                    <li key={`${r.label}-${i}`}>
                      <span className="text-text-muted">[{r.type}]</span>{" "}
                      {r.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
