export function orgPath(orgSlug: string, ...rest: string[]) {
  const extra = rest.length > 0 ? `/${rest.join("/")}` : "";
  return `/company/${orgSlug}${extra}`;
}

export function workspacePath(
  orgSlug: string,
  workspaceSlug: string,
  ...rest: string[]
) {
  return orgPath(orgSlug, workspaceSlug, ...rest);
}
