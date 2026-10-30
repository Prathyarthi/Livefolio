import { getPortfolioPublicUrl } from "@/lib/domain";
import {
  VOUCH_RELATIONSHIP_LABELS,
  VOUCH_RESEND_COOLDOWN_MS,
  type VouchRelationship,
  type VouchStatus,
} from "./constants";
import { vouchSharePath } from "./constants";
import { isInvitedReferee, isVouchRelationship } from "./validation";

type RefereeBits = {
  name: string;
  avatar: string | null;
  portfolio?: {
    slug: string | null;
    isPublished: boolean;
    avatarUrl: string | null;
    profileImageUrl: string | null;
  } | null;
};

type RequesterBits = {
  name: string;
  avatar: string | null;
  portfolio?: {
    title: string;
    headline: string;
    slug: string | null;
    isPublished: boolean;
    avatarUrl: string | null;
    profileImageUrl: string | null;
  } | null;
};

function refereeAvatar(user: RefereeBits | RequesterBits | null | undefined) {
  if (!user) return null;
  return (
    user.portfolio?.profileImageUrl ||
    user.portfolio?.avatarUrl ||
    user.avatar ||
    null
  );
}

function publishedPortfolioUrl(
  portfolio: { slug: string | null; isPublished: boolean } | null | undefined,
) {
  if (!portfolio?.isPublished || !portfolio.slug) return null;
  return getPortfolioPublicUrl(portfolio.slug);
}

export function canResendAt(lastEmailedAt: Date | null, now = new Date()) {
  if (!lastEmailedAt) return true;
  return now.getTime() - lastEmailedAt.getTime() >= VOUCH_RESEND_COOLDOWN_MS;
}

export function serializeAskedVouch(row: {
  id: string;
  token: string;
  status: string;
  inviteEmail: string;
  inviteName: string | null;
  personalNote: string | null;
  relationship: string | null;
  story: string | null;
  lastEmailedAt: Date | null;
  emailCount: number;
  completedAt: Date | null;
  createdAt: Date;
  referee: RefereeBits | null;
}) {
  const relationship = isVouchRelationship(row.relationship)
    ? row.relationship
    : null;

  return {
    id: row.id,
    status: row.status as VouchStatus,
    inviteEmail: row.inviteEmail,
    inviteName: row.inviteName,
    personalNote: row.personalNote,
    sharePath: vouchSharePath(row.token),
    emailCount: row.emailCount,
    canResend: row.status === "pending" && canResendAt(row.lastEmailedAt),
    lastEmailedAt: row.lastEmailedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    relationship,
    relationshipLabel: relationship
      ? VOUCH_RELATIONSHIP_LABELS[relationship]
      : null,
    story: row.story,
    referee: row.referee
      ? {
          name: row.referee.name,
          avatarUrl: refereeAvatar(row.referee),
          portfolioUrl: publishedPortfolioUrl(row.referee.portfolio),
        }
      : null,
  };
}

export function serializeIncomingVouch(row: {
  id: string;
  token: string;
  status: string;
  personalNote: string | null;
  createdAt: Date;
  requester: RequesterBits;
}) {
  return {
    id: row.id,
    status: row.status as VouchStatus,
    personalNote: row.personalNote,
    sharePath: vouchSharePath(row.token),
    createdAt: row.createdAt.toISOString(),
    requester: {
      name: row.requester.name,
      headline: row.requester.portfolio?.headline || null,
      title: row.requester.portfolio?.title || null,
      avatarUrl: refereeAvatar(row.requester),
      portfolioUrl: publishedPortfolioUrl(row.requester.portfolio),
    },
  };
}

export function serializeTokenVouch(
  row: {
    token: string;
    inviteEmail: string;
    status: string;
    personalNote: string | null;
    relationship: string | null;
    story: string | null;
    completedAt: Date | null;
    requesterId: string;
    requester: RequesterBits;
    referee: RefereeBits | null;
  },
  viewer?: { userId?: string | null; email?: string | null },
) {
  const relationship = isVouchRelationship(row.relationship)
    ? (row.relationship as VouchRelationship)
    : null;
  const isRequester = viewer?.userId === row.requesterId;
  const isInvitee = isInvitedReferee(row.inviteEmail, viewer?.email);
  const isComplete = row.status === "completed";

  return {
    token: row.token,
    status: row.status as VouchStatus,
    inviteEmail: row.inviteEmail,
    personalNote: row.status === "pending" ? row.personalNote : null,
    isRequester,
    isInvitee,
    requester: {
      name: row.requester.name,
      headline: row.requester.portfolio?.headline || null,
      title: row.requester.portfolio?.title || null,
      avatarUrl: refereeAvatar(row.requester),
      portfolioUrl: publishedPortfolioUrl(row.requester.portfolio),
    },
    completed:
      isComplete && relationship && row.story
        ? {
            relationship,
            relationshipLabel: VOUCH_RELATIONSHIP_LABELS[relationship],
            story: row.story,
            completedAt: row.completedAt?.toISOString() ?? null,
            refereeName: row.referee?.name ?? null,
          }
        : null,
  };
}
