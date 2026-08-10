export const ORG_ROLES = [
  "owner",
  "admin",
  "recruiter",
  "hiring_manager",
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

/** Can manage company settings and members. */
export function canManageOrganization(role: string): boolean {
  return role === "owner" || role === "admin";
}

/** Can create, edit, publish, and close jobs. */
export function canManageJobs(role: string): boolean {
  return role === "owner" || role === "admin" || role === "recruiter";
}

/** Can view applicants for jobs in the org (Phase 2+). */
export function canViewApplicants(role: string): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "recruiter" ||
    role === "hiring_manager"
  );
}

/** Move stages, shortlist, and add notes. */
export function canManageApplicants(role: string): boolean {
  return canViewApplicants(role);
}
