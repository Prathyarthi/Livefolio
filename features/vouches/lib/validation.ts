import {
  ContentValidationError,
  normalizeOptionalEmail,
  normalizeOptionalLabel,
  normalizeRequiredLabel,
} from "@/lib/content-policy";
import {
  STATUSES_COUNTING_TOWARD_LIMIT,
  VOUCH_NOTE_MAX_CHARS,
  VOUCH_RELATIONSHIPS,
  VOUCH_STATUSES,
  VOUCH_STORY_MAX_CHARS,
  VOUCH_STORY_MIN_CHARS,
  type VouchRelationship,
  type VouchStatus,
} from "./constants";

export function isVouchStatus(value: unknown): value is VouchStatus {
  return (
    typeof value === "string" &&
    (VOUCH_STATUSES as readonly string[]).includes(value)
  );
}

export function isVouchRelationship(value: unknown): value is VouchRelationship {
  return (
    typeof value === "string" &&
    (VOUCH_RELATIONSHIPS as readonly string[]).includes(value)
  );
}

export function normalizeInviteEmail(value: string): string {
  const email = normalizeOptionalEmail(value, "Email");
  if (!email) {
    throw new ContentValidationError("Email is required");
  }
  return email;
}

export function normalizeInviteName(value: string | null | undefined) {
  return normalizeOptionalLabel(value, "Name", 80);
}

export function normalizePersonalNote(value: string | null | undefined) {
  if (value == null || !value.trim()) return null;
  return normalizeRequiredLabel(value, "Note", VOUCH_NOTE_MAX_CHARS);
}

export function normalizeVouchStory(value: string): string {
  const story = normalizeRequiredLabel(value, "Story", VOUCH_STORY_MAX_CHARS);
  if (story.length < VOUCH_STORY_MIN_CHARS) {
    throw new ContentValidationError(
      `Share one specific thing — at least ${VOUCH_STORY_MIN_CHARS} characters`,
    );
  }
  return story;
}

export function parseRelationship(value: unknown): VouchRelationship {
  if (!isVouchRelationship(value)) {
    throw new ContentValidationError("Choose how you know them");
  }
  return value;
}

export function countsTowardVouchLimit(status: string): boolean {
  return (STATUSES_COUNTING_TOWARD_LIMIT as readonly string[]).includes(status);
}

export function isInvitedReferee(
  inviteEmail: string,
  viewerEmail: string | null | undefined,
): boolean {
  if (!viewerEmail) return false;
  return inviteEmail.trim().toLowerCase() === viewerEmail.trim().toLowerCase();
}