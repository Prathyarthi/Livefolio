import { generateOpenRouterText } from "@/lib/openrouter";
import {
  heuristicCompileQuery,
  type FilterAst,
} from "@/lib/recruiter-search";

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in model response");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeAst(raw: unknown): FilterAst {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const skills = Array.isArray(o.skills)
    ? o.skills.filter((s): s is string => typeof s === "string").slice(0, 20)
    : undefined;
  const titles = Array.isArray(o.titles)
    ? o.titles.filter((s): s is string => typeof s === "string").slice(0, 12)
    : undefined;
  const companies = Array.isArray(o.companies)
    ? o.companies.filter((s): s is string => typeof s === "string").slice(0, 12)
    : undefined;
  const keywords = Array.isArray(o.keywords)
    ? o.keywords.filter((s): s is string => typeof s === "string").slice(0, 20)
    : undefined;

  let activeOnPlatformWithinDays: FilterAst["activeOnPlatformWithinDays"];
  if (o.activeOnPlatformWithinDays && typeof o.activeOnPlatformWithinDays === "object") {
    const a = o.activeOnPlatformWithinDays as Record<string, unknown>;
    if (typeof a.platform === "string" && typeof a.days === "number") {
      activeOnPlatformWithinDays = {
        platform: a.platform.toLowerCase(),
        days: a.days,
        must: Boolean(a.must),
      };
    }
  }

  let minPlatformStat: FilterAst["minPlatformStat"];
  if (o.minPlatformStat && typeof o.minPlatformStat === "object") {
    const m = o.minPlatformStat as Record<string, unknown>;
    if (
      typeof m.platform === "string" &&
      typeof m.key === "string" &&
      typeof m.min === "number"
    ) {
      minPlatformStat = {
        platform: m.platform.toLowerCase(),
        key: m.key,
        min: m.min,
        must: Boolean(m.must),
      };
    }
  }

  return {
    skills: skills?.length ? skills : undefined,
    minYears: typeof o.minYears === "number" ? o.minYears : undefined,
    titles: titles?.length ? titles : undefined,
    companies: companies?.length ? companies : undefined,
    keywords: keywords?.length ? keywords : undefined,
    activeOnPlatformWithinDays,
    minPlatformStat,
    requiresLiveDemo: Boolean(o.requiresLiveDemo) || undefined,
    requiresPublishedContent: Boolean(o.requiresPublishedContent) || undefined,
  };
}

const SYSTEM = `You compile recruiter search queries into a JSON filter AST for a multi-role talent platform.
Return ONLY JSON with this shape:
{
  "skills": string[],
  "minYears": number | null,
  "titles": string[],
  "companies": string[],
  "keywords": string[],
  "activeOnPlatformWithinDays": { "platform": string, "days": number, "must": boolean } | null,
  "minPlatformStat": { "platform": string, "key": string, "min": number, "must": boolean } | null,
  "requiresLiveDemo": boolean,
  "requiresPublishedContent": boolean
}
Rules:
- Extract role-agnostic skills and titles (design, marketing, product, engineering, etc.).
- Baseline fields (skills/years/titles/keywords) drive recall.
- Amplifier fields are optional; set must:true only when the query clearly requires living proof/activity.
- Known platforms today include github, leetcode, medium — but do not assume every candidate is an engineer.
- Prefer soft amplifiers (must:false) unless the user says "must", "required", or "only".`;

export async function compileRecruiterQuery(input: {
  text: string;
  inputType: "jd" | "nl";
}): Promise<{ ast: FilterAst; source: "ai" | "heuristic" }> {
  const trimmed = input.text.trim();
  if (!trimmed) return { ast: {}, source: "heuristic" };

  try {
    const text = await generateOpenRouterText({
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Input type: ${input.inputType}\n\n${trimmed}`,
        },
      ],
      temperature: 0.1,
    });
    const ast = normalizeAst(extractJsonObject(text));
    return { ast, source: "ai" };
  } catch {
    return { ast: heuristicCompileQuery(trimmed), source: "heuristic" };
  }
}

export function astToChips(ast: FilterAst): Array<{
  id: string;
  label: string;
  kind: "baseline" | "amplifier";
}> {
  const chips: Array<{ id: string; label: string; kind: "baseline" | "amplifier" }> = [];
  for (const skill of ast.skills ?? []) {
    chips.push({ id: `skill:${skill}`, label: skill, kind: "baseline" });
  }
  if (typeof ast.minYears === "number") {
    chips.push({
      id: `years:${ast.minYears}`,
      label: `${ast.minYears}+ years`,
      kind: "baseline",
    });
  }
  for (const title of ast.titles ?? []) {
    chips.push({ id: `title:${title}`, label: title, kind: "baseline" });
  }
  for (const kw of (ast.keywords ?? []).slice(0, 8)) {
    chips.push({ id: `kw:${kw}`, label: kw, kind: "baseline" });
  }
  if (ast.activeOnPlatformWithinDays) {
    const a = ast.activeOnPlatformWithinDays;
    chips.push({
      id: `active:${a.platform}:${a.days}`,
      label: `Active on ${a.platform} (${a.days}d)${a.must ? " · must" : ""}`,
      kind: "amplifier",
    });
  }
  if (ast.minPlatformStat) {
    const m = ast.minPlatformStat;
    chips.push({
      id: `stat:${m.platform}:${m.key}`,
      label: `${m.platform} ${m.key} ≥ ${m.min}${m.must ? " · must" : ""}`,
      kind: "amplifier",
    });
  }
  if (ast.requiresLiveDemo) {
    chips.push({ id: "liveDemo", label: "Live demo", kind: "amplifier" });
  }
  if (ast.requiresPublishedContent) {
    chips.push({
      id: "published",
      label: "Published content",
      kind: "amplifier",
    });
  }
  return chips;
}
