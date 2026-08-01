"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParsedResume } from "@/lib/gemini";

type Social = {
  platform: string;
  url: string;
  username: string | null;
  fetchStatus: string;
  lastFetched: string | null;
  cachedStats: Record<string, unknown> | null;
};

type Project = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  liveUrl: string | null;
  sourceUrl: string | null;
  origin: string;
};

type Claim = {
  claim: string;
  status: string;
  evidence: string[];
};

function statusColor(status: string) {
  switch (status) {
    case "supported":
      return "bg-success/15 text-success";
    case "partial":
      return "bg-warning/15 text-warning";
    case "unsupported":
      return "bg-danger/15 text-danger";
    default:
      return "bg-surface-sunken text-text-muted";
  }
}

function freshnessLabel(lastFetched: string | null) {
  if (!lastFetched) return null;
  const days = Math.floor(
    (Date.now() - Date.parse(lastFetched)) / (24 * 60 * 60 * 1000)
  );
  if (Number.isNaN(days)) return null;
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

export function RecruiterBrief({
  displayName,
  headline,
  summary,
  source,
  email,
  socialProfiles,
  projects,
  parsed,
  claimsVsProof,
}: {
  displayName: string;
  headline: string;
  summary: string;
  source: string;
  email: string | null;
  socialProfiles: Social[];
  projects: Project[];
  parsed: ParsedResume;
  claimsVsProof: Claim[];
}) {
  const enriched = socialProfiles.filter((s) => s.fetchStatus === "enriched");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            {displayName}
          </h1>
          <Badge variant="secondary">
            {source === "livefolio_profile" ? "LiveFolio" : "Resume enrich"}
          </Badge>
        </div>
        {headline ? (
          <p className="mt-1 text-body text-text-secondary">{headline}</p>
        ) : null}
        {email ? (
          <p className="mt-1 text-sm text-text-muted">{email}</p>
        ) : null}
      </div>

      {socialProfiles.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected sources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {socialProfiles.map((s) => {
              const fresh = freshnessLabel(s.lastFetched);
              return (
                <Badge key={s.platform} variant="outline" className="gap-1.5">
                  <span className="capitalize">{s.platform}</span>
                  <span className="text-text-muted">· {s.fetchStatus}</span>
                  {fresh ? (
                    <span className="text-text-muted">· {fresh}</span>
                  ) : null}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {enriched.length > 0 || claimsVsProof.some((c) => c.status !== "unverified") ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claims vs proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {claimsVsProof.slice(0, 16).map((item, i) => (
              <div
                key={`${item.claim}-${i}`}
                className="rounded-md border border-border-default px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text-primary">
                    {item.claim}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs capitalize ${statusColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.evidence.length ? (
                  <ul className="mt-1 list-inside list-disc text-sm text-text-secondary">
                    {item.evidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
              {summary}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {(parsed.skills?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {parsed.skills.map((s) => (
              <Badge key={s.name} variant="secondary">
                {s.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {(parsed.experiences?.length ?? 0) > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsed.experiences.map((exp, i) => (
              <div key={`${exp.company}-${exp.role}-${i}`}>
                <p className="font-medium text-text-primary">
                  {exp.role} · {exp.company}
                </p>
                {exp.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                    {exp.description}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {projects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work samples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.slice(0, 20).map((p) => (
              <div key={p.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-text-primary">{p.title}</p>
                  <Badge variant="outline">{p.origin}</Badge>
                </div>
                {p.description ? (
                  <p className="mt-1 text-sm text-text-secondary line-clamp-3">
                    {p.description}
                  </p>
                ) : null}
                {p.techStack.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.techStack.slice(0, 6).map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
