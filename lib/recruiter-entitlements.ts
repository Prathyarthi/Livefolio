/** Soft beta limits for recruiter orgs (no B2B billing yet). */

export const RECRUITER_LIMITS = {
  maxOrgsPerUser: 1,
  maxMembersPerOrg: 5,
  maxActiveCandidatesPerOrg: 100,
  maxResumeEnrichmentsPerMonth: 50,
  maxSearchesPerDay: 100,
} as const;

export type RecruiterLimitCode =
  | "ORG_LIMIT"
  | "MEMBER_LIMIT"
  | "CANDIDATE_LIMIT"
  | "ENRICHMENT_LIMIT"
  | "SEARCH_LIMIT";

export function recruiterLimitMessage(code: RecruiterLimitCode): string {
  switch (code) {
    case "ORG_LIMIT":
      return "Beta allows one organization per account.";
    case "MEMBER_LIMIT":
      return `Beta allows up to ${RECRUITER_LIMITS.maxMembersPerOrg} members per organization.`;
    case "CANDIDATE_LIMIT":
      return `Beta allows up to ${RECRUITER_LIMITS.maxActiveCandidatesPerOrg} active candidates per organization.`;
    case "ENRICHMENT_LIMIT":
      return `Beta allows up to ${RECRUITER_LIMITS.maxResumeEnrichmentsPerMonth} resume uploads per month.`;
    case "SEARCH_LIMIT":
      return `Beta allows up to ${RECRUITER_LIMITS.maxSearchesPerDay} searches per day.`;
  }
}
