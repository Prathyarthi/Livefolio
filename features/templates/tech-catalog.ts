import simpleIconCatalog from "./simple-icon-catalog.json";

export type TechEntry = {
  label: string;
  slug: string | null;
  aliases: string[];
};

type IconRow = { t: string; s: string };

const EXTRA_ALIASES: Record<string, string[]> = {
  javascript: ["js"],
  typescript: ["ts"],
  nextdotjs: ["next", "nextjs", "next.js"],
  nodedotjs: ["node", "nodejs", "node.js"],
  react: ["reactjs", "react.js"],
  express: ["expressjs", "express.js"],
  mongodb: ["mongo"],
  postgresql: ["postgres", "psql", "sql"],
  tailwindcss: ["tailwind"],
  vuedotjs: ["vue", "vuejs", "vue.js"],
  amazonwebservices: ["aws"],
  socketdotio: [
    "socket io",
    "socket.io",
    "websocket",
    "websockets",
    "web socket",
    "web sockets",
    "ws",
  ],
  appwrite: ["app write", "appwrite"],
  github: ["gh", "github api"],
  hono: ["honno", "honoro", "honojs"],
  cloudinary: ["cloudnary"],
  pytorch: ["torch"],
  tensorflow: ["tf"],
  huggingface: ["hugging face"],
  googlegemini: ["gemini", "google gemini"],
  openai: ["chatgpt", "gpt"],
  shadcnui: ["shadcn", "shadcn/ui"],
  mui: ["material-ui", "material ui"],
  cplusplus: ["c++", "cpp"],
  csharp: ["c#", "dotnet", ".net"],
  kubernetes: ["k8s"],
  apachekafka: ["kafka"],
};

const CUSTOM_ENTRIES: TechEntry[] = [
  {
    label: "Elysia",
    slug: "elysia",
    aliases: ["elysiajs", "elysia.js"],
  },
  {
    label: "Java",
    slug: "java",
    aliases: ["jdk", "jvm", "openjdk"],
  },
];

export const TECH_CATALOG: TechEntry[] = [
  ...CUSTOM_ENTRIES,
  ...(simpleIconCatalog as IconRow[]).map((icon) => ({
    label: icon.t,
    slug: icon.s,
    aliases: EXTRA_ALIASES[icon.s] ?? [],
  })),
];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s._/-]+/g, "");
}

function catalogKeys(entry: TechEntry): string[] {
  return [entry.label, entry.slug ?? "", ...entry.aliases].map(normalize);
}

function queryVariants(queryRaw: string): string[] {
  const q = normalize(queryRaw);
  if (!q) return [];
  const variants = new Set<string>([q]);
  if (q.endsWith("js") && q.length > 4) variants.add(q.slice(0, -2));
  if (q.endsWith("dotjs") && q.length > 7) variants.add(q.slice(0, -5));
  return [...variants];
}

function scoreEntry(queryRaw: string, entry: TechEntry): number {
  const variants = queryVariants(queryRaw);
  if (variants.length === 0) return Number.POSITIVE_INFINITY;
  const keys = catalogKeys(entry);
  let score = Number.POSITIVE_INFINITY;

  for (const q of variants) {
    for (const key of keys) {
      if (!key) continue;
      if (key === q) score = Math.min(score, 0);
      else if (key.startsWith(q) && q.length >= 2) score = Math.min(score, 1);
      else if (q.startsWith(key) && key.length >= 4) score = Math.min(score, 1);
      else if (key.includes(q) && q.length >= 3) score = Math.min(score, 2);
    }
  }

  const stopWords = new Set([
    "api",
    "sdk",
    "cli",
    "lib",
    "library",
    "framework",
    "official",
    "icon",
    "logo",
    "the",
    "and",
    "for",
    "with",
    "of",
    "app",
    "service",
    "services",
    "rest",
    "client",
  ]);
  const words = queryRaw
    .toLowerCase()
    .split(/\s+/)
    .map((word) => normalize(word))
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  for (const word of words) {
    for (const key of keys) {
      if (!key) continue;
      if (key === word) score = Math.min(score, 1);
      else if (key.startsWith(word) && word.length >= 3) score = Math.min(score, 1);
      else if (word.startsWith(key) && key.length >= 4) score = Math.min(score, 2);
    }
  }

  return score;
}

function bestOfficialMatch(
  name: string,
  maxScore = 2,
): TechEntry | null {
  let best: { entry: TechEntry; score: number } | null = null;
  for (const entry of TECH_CATALOG) {
    if (!entry.slug) continue;
    const score = scoreEntry(name, entry);
    if (score > maxScore) continue;
    if (!best || score < best.score) {
      best = { entry, score };
      if (score === 0) break;
    }
  }
  return best?.entry ?? null;
}

export function resolveTechIcon(name: string): { slug: string | null } {
  return { slug: bestOfficialMatch(name)?.slug ?? null };
}

export function resolveOfficialTech(name: string): TechEntry | null {
  return bestOfficialMatch(name, 0) ?? bestOfficialMatch(name, 1);
}

export function suggestTechs(
  query: string,
  exclude: string[] = [],
  extra: string[] = [],
  limit = 12,
): TechEntry[] {
  const trimmed = query.trim();
  if (!normalize(trimmed)) return [];

  const excluded = new Set(exclude.map(normalize));
  const extraEntries = extra
    .map((name) => bestOfficialMatch(name, 0))
    .filter((entry): entry is TechEntry => Boolean(entry));

  const seen = new Set<string>();
  const results: TechEntry[] = [];

  const push = (entry: TechEntry) => {
    if (!entry.slug || excluded.has(normalize(entry.label))) return;
    const key = normalize(entry.label);
    if (seen.has(key)) return;
    seen.add(key);
    results.push(entry);
  };

  const matched = bestOfficialMatch(trimmed);
  if (
    matched?.slug &&
    !excluded.has(normalize(trimmed)) &&
    normalize(trimmed) !== normalize(matched.label)
  ) {
    push({
      label: trimmed,
      slug: matched.slug,
      aliases: [],
    });
  }

  const scored = [...TECH_CATALOG, ...extraEntries]
    .map((entry) => ({ entry, score: scoreEntry(trimmed, entry) }))
    .filter((item) => item.entry.slug && item.score <= 2)
    .sort(
      (a, b) =>
        a.score - b.score || a.entry.label.localeCompare(b.entry.label),
    );

  for (const item of scored) {
    push(item.entry);
    if (results.length >= limit) break;
  }

  return results;
}

const CUSTOM_ICON_URLS: Record<string, string> = {
  elysia: "/tech-icons/elysia.svg",
  java: "/tech-icons/java.svg",
};

export function techIconUrl(slug: string): string {
  return CUSTOM_ICON_URLS[slug] ?? `https://cdn.simpleicons.org/${slug}`;
}
