export const ACCOUNT_TYPES = ["portfolio", "recruiter"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Cookie set before OAuth to persist portfolio vs recruiter login intent. */
export const LOGIN_INTENT_COOKIE = "lf_login_intent";

export function parseAccountType(value: unknown): AccountType {
  return value === "recruiter" ? "recruiter" : "portfolio";
}

export function isRecruiterAccount(accountType: unknown): boolean {
  return parseAccountType(accountType) === "recruiter";
}

export function homePathForAccountType(accountType: AccountType): string {
  return accountType === "recruiter" ? "/recruiter" : "/dashboard";
}

export function setLoginIntentCookie(accountType: AccountType) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 10;
  document.cookie = `${LOGIN_INTENT_COOKIE}=${accountType}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
