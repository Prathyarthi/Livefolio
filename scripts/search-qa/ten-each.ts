import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { rankAgainstJob } from "@/features/search/lib/rank";
import {
  buildCandidate,
  qaJob,
  rng,
  type Fit,
  type GeneratedCandidate,
  type ProfessionId,
  type Style,
} from "./fixtures";

export type Spec = { fit: Fit; style: Style; minYears: number; withProof?: boolean };

export const MIX: Spec[] = [
  { fit: "strong", style: "listed", minYears: 4, withProof: true },
  { fit: "strong", style: "experience", minYears: 4, withProof: false },
  { fit: "strong", style: "custom", minYears: 4, withProof: true },
  { fit: "strong", style: "sparse", minYears: 4, withProof: false },
  { fit: "partial", style: "projects", minYears: 4, withProof: true },
  { fit: "partial", style: "listed", minYears: 4, withProof: false },
  { fit: "adjacent", style: "listed", minYears: 4, withProof: true },
  { fit: "adjacent", style: "experience", minYears: 4, withProof: false },
  { fit: "unrelated", style: "listed", minYears: 4, withProof: true },
  { fit: "unrelated", style: "custom", minYears: 4, withProof: true },
];

export const GITHUB_LOGINS = ["Prathyarthi", "KIRAN-BUSARI"] as const;

type GhUser = {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  created_at: string;
};
type GhRepo = {
  name: string;
  fork: boolean;
  description: string | null;
  language: string | null;
  html_url: string;
  homepage: string | null;
};

export async function githubSnapshot(login: string): Promise<GeneratedCandidate> {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "livefolio-search-qa" };
  const user = (await (await fetch(`https://api.github.com/users/${login}`, { headers })).json()) as GhUser;
  const repos = (
    (await (await fetch(`https://api.github.com/users/${login}/repos?sort=updated&per_page=15`, { headers })).json()) as GhRepo[]
  ).filter((repo) => !repo.fork);
  const langs = [...new Set(repos.map((repo) => repo.language).filter(Boolean))] as string[];
  const snapshot: ApplicationSnapshotData = {
    version: 1,
    capturedAt: new Date().toISOString(),
    profile: {
      title: user.name || login,
      headline: user.bio || "Software developer",
      summary: `${user.public_repos} public repositories on GitHub since ${user.created_at.slice(0, 4)}.`,
      avatarUrl: null,
      location: user.location,
      contactEmail: null,
      websiteUrl: user.blog ? (user.blog.startsWith("http") ? user.blog : `https://${user.blog}`) : null,
      slug: login.toLowerCase(),
    },
    experiences: [],
    educations: [],
    skills: langs.map((name) => ({ name, category: "engineering", level: null })),
    projects: repos.slice(0, 8).map((repo, i) => ({
      title: repo.name,
      description: repo.description || `${repo.language ?? "Code"} project`,
      liveUrl: repo.homepage || null,
      sourceUrl: repo.html_url,
      techStack: repo.language ? [repo.language] : [],
      featured: i === 0,
    })),
    articles: [],
    certifications: [],
    achievements: [],
    socialProfiles: [
      {
        platform: "github",
        url: `https://github.com/${login}`,
        username: login,
        cachedStats: { totalContributions: Math.min(120, user.public_repos) },
      },
    ],
    customSections: [],
  };
  const years = Math.max(1, new Date().getFullYear() - Number(user.created_at.slice(0, 4)));
  return {
    key: `github-${login}`,
    name: user.name || login,
    email: `${login.toLowerCase()}@github.example`,
    profession: "backend",
    fit: "partial",
    style: "projects",
    years,
    city: user.location || "—",
    snapshot,
  };
}

async function run(
  target: ProfessionId,
  seed: number,
  extras: GeneratedCandidate[] = [],
  synthCount = MIX.length,
) {
  const job = qaJob(target);
  const r = rng(seed);
  const people = [
    ...MIX.slice(0, synthCount).map((spec, i) =>
      buildCandidate(r, { index: seed + i, target, ...spec }),
    ),
    ...extras,
  ];
  const ranked = people
    .map((c) => ({ c, rank: rankAgainstJob(c.snapshot, job.profile, { name: c.name }) }))
    .sort((a, b) => b.rank.score - a.rank.score);

  console.log(`\n${job.input.title}`);
  console.log(`must-haves: ${job.profile.mustHaves.join(", ")}  ·  ${job.profile.roleFamily}`);
  console.log(
    "rank  score  expected    where skills live   yrs  candidate                 why",
  );
  ranked.forEach((row, i) => {
    const why = row.rank.reasons[0] ?? "";
    const source = row.c.key.startsWith("github-") ? "github profile     " : row.c.style.padEnd(20);
    console.log(
      `${String(i + 1).padStart(2)}    ${String(row.rank.score).padStart(3)}    ${row.c.fit.padEnd(11)}${source}${String(row.c.years).padStart(2)}   ${row.c.name.padEnd(24)} ${why}`,
    );
  });
  const order = ranked.map((row) => row.c.fit);
  const firstUnrelated = order.indexOf("unrelated");
  const lastStrong = order.lastIndexOf("strong");
  const ok = lastStrong < firstUnrelated || firstUnrelated === -1;
  console.log(ok ? "order: all strong fits above unrelated ✓" : "order: a strong fit landed below an unrelated profile ✗");
}

if (import.meta.main) {
  const github = await Promise.all(GITHUB_LOGINS.map(githubSnapshot));
  await run("backend", 21, github, 8);
  await run("marketer", 22);
}
