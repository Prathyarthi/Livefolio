import type { DraftJob } from "@/features/agent-hiring/lib/brief";
import type { ShortlistCandidate } from "@/features/agent-hiring/lib/shortlist";

export type AgentJobRef = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "paused" | "closed";
};

export type AgentInvite = { subject: string; body: string; sent?: boolean };

export type AgentSession = {
  brief: string;
  draft: DraftJob | null;
  job: AgentJobRef | null;
  result: {
    job: { id: string; title: string };
    rankingVersion: string;
    talentSearch: boolean;
    pools: { applicants: number; sourced: number };
    candidates: ShortlistCandidate[];
  } | null;
  selected: Record<string, boolean>;
  invites: Record<string, AgentInvite>;
};

export function agentSessionKey(orgSlug: string, workspaceSlug: string) {
  return `livefolio.agentHiring.${orgSlug}.${workspaceSlug}`;
}

const JOB_STATUSES = new Set(["draft", "published", "paused", "closed"]);

function asDraft(value: unknown): DraftJob | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<DraftJob>;
  if (typeof draft.title !== "string" || typeof draft.summary !== "string") return null;
  if (!Array.isArray(draft.requirements) || !Array.isArray(draft.responsibilities)) return null;
  return draft as DraftJob;
}

function asJob(value: unknown): AgentJobRef | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Partial<AgentJobRef>;
  if (!job.id || !job.title || !job.slug || !job.status || !JOB_STATUSES.has(job.status)) {
    return null;
  }
  return { id: job.id, title: job.title, slug: job.slug, status: job.status };
}

/** Restores a tab session. Returns null when the payload is missing or unusable. */
export function parseAgentSession(raw: string | null): AgentSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<AgentSession>;
    if (typeof data.brief !== "string") return null;
    if (data.draft != null && !asDraft(data.draft)) return null;
    return {
      brief: data.brief,
      draft: asDraft(data.draft),
      job: asJob(data.job),
      result: data.result && Array.isArray(data.result.candidates) ? data.result : null,
      selected:
        data.selected && typeof data.selected === "object" ? data.selected : {},
      invites: data.invites && typeof data.invites === "object" ? data.invites : {},
    };
  } catch {
    return null;
  }
}

export function readAgentSession(key: string): AgentSession | null {
  if (typeof window === "undefined") return null;
  return parseAgentSession(window.sessionStorage.getItem(key));
}

export function writeAgentSession(key: string, session: AgentSession) {
  window.sessionStorage.setItem(key, JSON.stringify(session));
}

export function clearAgentSession(key: string) {
  window.sessionStorage.removeItem(key);
}
