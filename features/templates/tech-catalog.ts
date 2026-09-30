import simpleIconCatalog from "./simple-icon-catalog.json";

export type TechEntry = {
  label: string;
  slug: string | null;
};

type IconRow = { t: string; s: string };

export const TECH_CATALOG: TechEntry[] = (simpleIconCatalog as IconRow[]).map(
  (icon) => ({
    label: icon.t,
    slug: icon.s,
  }),
);

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s._/-]+/g, "");
}

function iconKeys(entry: TechEntry): string[] {
  const label = normalize(entry.label);
  const slug = (entry.slug ?? "").toLowerCase().replace(/dot/g, "");
  return [label, slug].filter(Boolean);
}

/** 0 exact, 1 prefix, 2 contains, 3 none. */
function matchRank(query: string, entry: TechEntry): number {
  const q = normalize(query);
  if (!q) return 3;
  let rank = 3;
  for (const key of iconKeys(entry)) {
    if (key === q) rank = Math.min(rank, 0);
    else if (q.length >= 2 && key.startsWith(q)) rank = Math.min(rank, 1);
    else if (key.length >= 4 && q.startsWith(key) && q.length - key.length <= 3) {
      rank = Math.min(rank, 1);
    } else if (q.length >= 3 && key.includes(q)) {
      rank = Math.min(rank, 2);
    }
  }
  return rank;
}

export function resolveTechIcon(name: string): { slug: string | null } {
  const q = normalize(name);
  if (!q) return { slug: null };

  let best: { slug: string; rank: number; gap: number } | null = null;
  for (const entry of TECH_CATALOG) {
    if (!entry.slug) continue;
    const rank = matchRank(q, entry);
    if (rank > 1) continue;
    const gap = Math.abs(normalize(entry.label).length - q.length);
    if (rank === 1 && gap > 3) continue;
    if (!best || rank < best.rank || (rank === best.rank && gap < best.gap)) {
      best = { slug: entry.slug, rank, gap };
      if (rank === 0 && gap === 0) break;
    }
  }

  return { slug: best?.slug ?? null };
}

export function suggestTechs(
  query: string,
  exclude: string[] = [],
  extra: string[] = [],
  limit = 8,
): TechEntry[] {
  const trimmed = query.trim();
  const q = normalize(trimmed);
  if (!q) return [];

  const excluded = new Set(exclude.map((name) => name.toLowerCase()));
  const seen = new Set<string>();
  const results: TechEntry[] = [];

  const push = (entry: TechEntry) => {
    const key = entry.label.toLowerCase();
    if (!key || excluded.has(key) || seen.has(key)) return;
    seen.add(key);
    results.push(entry);
  };

  const official = TECH_CATALOG.find(
    (entry) => entry.slug && iconKeys(entry).some((key) => key === q),
  );
  push(official ?? { label: trimmed, slug: null });

  const matched = TECH_CATALOG
    .map((entry) => ({ entry, rank: matchRank(q, entry) }))
    .filter((item) => item.rank <= 2)
    .sort(
      (a, b) =>
        a.rank - b.rank || a.entry.label.localeCompare(b.entry.label),
    );

  for (const item of matched) {
    push(item.entry);
    if (results.length >= limit + 1) break;
  }

  for (const name of extra) {
    if (results.length >= limit + 1) break;
    if (!normalize(name).includes(q)) continue;
    push({ label: name.trim(), slug: resolveTechIcon(name).slug });
  }

  return results;
}

export function techIconUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}
