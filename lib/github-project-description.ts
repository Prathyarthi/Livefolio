const GITHUB_REST_TIMEOUT_MS = 45_000;

const SKIP_PARAGRAPH =
  /^(table of contents|installation|getting started|usage|contributing|license|changelog|mit license|apache license)/i;

function humanizeRepoName(name: string): string {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim();
  if (!spaced) return name;
  return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readmeParagraphs(markdown: string): string[] {
  const plain = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "\n\n")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1");

  return plain
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(
      (paragraph) =>
        paragraph.length >= 40
        && !SKIP_PARAGRAPH.test(paragraph)
        && !/permission is hereby granted|copyright \(c\)/i.test(paragraph),
    );
}

function toTwoLines(text: string): string {
  const sentences =
    text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()) ?? [text];
  if (sentences.length >= 2) {
    return `${sentences[0]}\n${sentences[1]}`;
  }
  return text;
}

function descriptionFromReadme(readme: string): string | null {
  const paragraph = readmeParagraphs(readme)[0];
  return paragraph ? toTwoLines(paragraph) : null;
}

function descriptionFromTitle(
  title: string,
  language?: string | null,
  topics?: string[],
): string {
  const name = humanizeRepoName(title);
  const line1 = `${name} is an open-source software project.`;
  const details = [language, topics?.slice(0, 2).join(" & ")].filter(Boolean);
  const line2 = details.length
    ? `Built with ${details.join(" · ")}.`
    : "Explore the repository for features and implementation details.";
  return `${line1}\n${line2}`;
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.raw",
        "User-Agent": "livefolio",
      },
      signal: AbortSignal.timeout(GITHUB_REST_TIMEOUT_MS),
    },
  );
  if (!res.ok) return null;
  const text = (await res.text()).trim();
  return text || null;
}

export async function resolveGitHubProjectDescription(
  owner: string,
  repo: {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
  },
): Promise<string> {
  if (repo.description?.trim()) return repo.description.trim();

  try {
    const readme = await fetchReadme(owner, repo.name);
    const fromReadme = readme ? descriptionFromReadme(readme) : null;
    if (fromReadme) return fromReadme;
  } catch {
    // Fall back to title-based description.
  }

  return descriptionFromTitle(repo.name, repo.language, repo.topics);
}

export async function resolveGitHubProjectDescriptions(
  owner: string,
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
  }>,
): Promise<string[]> {
  return Promise.all(repos.map((repo) => resolveGitHubProjectDescription(owner, repo)));
}
