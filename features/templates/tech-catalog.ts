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

/** Brands Simple Icons does not ship. Served from /tech-icons. */
const LOCAL_ICON_SLUGS: Record<string, string> = {
  elysia: "local/elysia",
  elysiajs: "local/elysia",
  websocket: "local/websocket",
  websockets: "local/websocket",
};

/**
 * Names that are a prefix of a different brand. "java" must not inherit
 * the JavaScript icon. Simple Icons does not ship the Java cup, so it is local.
 */
const EXACT_ALIASES: Record<string, TechEntry> = {
  java: { label: "Java", slug: "local/java" },
};

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

function exactMatches(query: string): TechEntry[] {
  const q = normalize(query);
  if (!q) return [];
  const found: TechEntry[] = [];
  const seen = new Set<string>();
  const add = (entry: TechEntry) => {
    const key = entry.label.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push(entry);
  };
  const alias = EXACT_ALIASES[q];
  if (alias) add(alias);
  for (const entry of TECH_CATALOG) {
    if (!entry.slug) continue;
    if (iconKeys(entry).some((key) => key === q)) add(entry);
  }
  return found;
}

export function resolveTechIcon(name: string): { slug: string | null } {
  const q = normalize(name);
  if (!q) return { slug: null };
  const local = LOCAL_ICON_SLUGS[q];
  if (local) return { slug: local };
  const alias = EXACT_ALIASES[q];
  if (alias?.slug) return { slug: alias.slug };

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

  const exact = exactMatches(trimmed);
  if (exact.length > 0) {
    for (const entry of exact) push(entry);
    for (const name of extra) {
      if (results.length >= limit) break;
      if (normalize(name) !== q) continue;
      push({ label: name.trim(), slug: resolveTechIcon(name).slug });
    }
    return results.slice(0, limit);
  }

  push({ label: trimmed, slug: null });

  for (const [key, entry] of Object.entries(EXACT_ALIASES)) {
    if (key.startsWith(q)) push(entry);
  }

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
  if (slug === "local/elysia") return "/tech-icons/elysia.svg";
  if (slug === "local/java") return "/tech-icons/java.svg";
  if (slug === "local/websocket") return "/tech-icons/websocket.png";
  return `https://cdn.simpleicons.org/${slug}`;
}
