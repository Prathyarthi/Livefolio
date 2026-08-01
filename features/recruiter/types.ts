import type { ParsedResume } from "@/lib/gemini";
import type { FilterAst, SearchHit } from "@/lib/recruiter-search";

export type RecruiterOrg = {
  id: string;
  name: string;
  slug: string;
};

export type RecruiterOrgResponse = {
  org: RecruiterOrg | null;
  role: string | null;
};

export type RecruiterCandidateListItem = {
  id: string;
  displayName: string;
  headline: string;
  source: string;
  enrichmentStatus: string;
  overallScore: number | null;
  recommendation: string | null;
  socialProfiles: Array<{
    platform: string;
    fetchStatus: string;
    lastFetched: string | null;
  }>;
  _count?: { notes: number };
};

export type RecruiterCandidateDetail = {
  id: string;
  displayName: string;
  headline: string;
  summary: string;
  source: string;
  email: string | null;
  overallScore: number | null;
  recommendation: string | null;
  status: string;
  parsedJson: ParsedResume;
  socialProfiles: Array<{
    platform: string;
    url: string;
    username: string | null;
    fetchStatus: string;
    lastFetched: string | null;
    cachedStats: Record<string, unknown> | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    techStack: string[];
    liveUrl: string | null;
    sourceUrl: string | null;
    origin: string;
  }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; avatar: string | null };
  }>;
  portfolio?: { id: string; slug: string | null; isPublished: boolean } | null;
};

export type ClaimProofItem = {
  claim: string;
  status: string;
  evidence: string[];
};

export type RecruiterSearchResponse = {
  ast: FilterAst;
  chips: Array<{ id: string; label: string; kind: string }>;
  results: SearchHit[];
  compileSource: string;
};

export type { FilterAst, SearchHit };
