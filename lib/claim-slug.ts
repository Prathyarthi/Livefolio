const STORAGE_KEY = "livefolio.claimSlug";
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

export function saveClaimedSlug(slug: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, slug);
}

export function readClaimedSlug(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  if (!value || !SLUG_PATTERN.test(value)) return null;
  return value;
}

export function clearClaimedSlug() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

/** Saves a checked name onto the signed-in portfolio. Does not reserve names for guests. */
export async function attachClaimedSlug() {
  const slug = readClaimedSlug();
  if (!slug) return false;

  const res = await fetch("/api/portfolio/slug", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });

  if (res.ok || res.status === 400 || res.status === 409) {
    clearClaimedSlug();
  }

  return res.ok;
}
