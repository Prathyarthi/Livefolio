/** Lightweight funnel events for recruiter beta (structured logs). */

export type RecruiterAnalyticsEvent =
  | { name: "org_created"; orgId: string; userId: string }
  | { name: "resume_enriched"; orgId: string; candidateId: string; platforms: string[] }
  | { name: "search_run"; orgId: string; resultCount: number; inputType: string }
  | { name: "dossier_scored"; orgId: string; candidateId: string; score: number | null }
  | { name: "livefolio_shortlisted"; orgId: string; portfolioId: string };

export function trackRecruiterEvent(event: RecruiterAnalyticsEvent) {
  console.info("[recruiter-analytics]", JSON.stringify({ ...event, at: new Date().toISOString() }));
}
