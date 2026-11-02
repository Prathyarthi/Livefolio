export const VOUCH_STATUSES = ["pending", "completed", "cancelled"] as const;
export type VouchStatus = (typeof VOUCH_STATUSES)[number];

export const VOUCH_RELATIONSHIPS = [
  "manager",
  "peer",
  "founder",
  "report",
  "collaborator",
  "other",
] as const;
export type VouchRelationship = (typeof VOUCH_RELATIONSHIPS)[number];

export const VOUCH_RELATIONSHIP_LABELS: Record<VouchRelationship, string> = {
  manager: "Manager",
  peer: "Peer",
  founder: "Founder",
  report: "Direct report",
  collaborator: "Collaborator",
  other: "Other",
};

export const FREE_VOUCH_REQUESTS = 3;
export const PRO_VOUCH_REQUESTS = 15;

export const VOUCH_STORY_MIN_CHARS = 20;
export const VOUCH_STORY_MAX_CHARS = 280;
export const VOUCH_NOTE_MAX_CHARS = 280;
export const VOUCH_RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const STATUSES_COUNTING_TOWARD_LIMIT: VouchStatus[] = [...VOUCH_STATUSES];

export function vouchSharePath(token: string) {
  return `/vouch/${token}`;
}