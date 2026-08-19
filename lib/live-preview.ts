export const FREE_MAX_LIVE_PREVIEWS = 0;
export const ACTIVE_MAX_LIVE_PREVIEWS = 50;

export const FREE_TRIAL_MAX_LIVE_PREVIEWS = FREE_MAX_LIVE_PREVIEWS;

export function isProSubscriptionStatus(
  subscriptionStatus: string | null | undefined
): boolean {
  return (subscriptionStatus ?? "").toLowerCase() === "active";
}

export function getMaxLivePreviews(
  subscriptionStatus: string | null | undefined
): number {
  return isProSubscriptionStatus(subscriptionStatus)
    ? ACTIVE_MAX_LIVE_PREVIEWS
    : FREE_MAX_LIVE_PREVIEWS;
}

export function isLivePreviewEnabledForProject(
  projectId: string,
  livePreviewProjectIds: string[] | null | undefined
): boolean {
  if (!livePreviewProjectIds?.length) return false;
  return livePreviewProjectIds.includes(projectId);
}

export function sanitizeLivePreviewProjectIds(
  requestedIds: string[],
  projects: Array<{ id: string; liveUrl: string | null }>,
  maxAllowed: number
): string[] {
  if (maxAllowed <= 0) return [];

  const eligible = new Set(
    projects
      .filter((project) => project.liveUrl?.trim())
      .map((project) => project.id)
  );

  const unique: string[] = [];
  for (const id of requestedIds) {
    if (!eligible.has(id) || unique.includes(id)) continue;
    unique.push(id);
    if (unique.length >= maxAllowed) break;
  }

  return unique;
}
