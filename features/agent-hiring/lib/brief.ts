import { z } from "zod";

/** Plain-language brief → draft job. The LLM does the reading; no term or synonym lists here. */

export const BRIEF_MIN = 12;
export const BRIEF_MAX = 4000;

const nullableString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const draftJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(5000),
  employmentType: z
    .enum(["full_time", "part_time", "contract", "internship"])
    .nullish()
    .catch(null)
    .transform((v) => v ?? null),
  workplaceType: z
    .enum(["remote", "hybrid", "on_site"])
    .nullish()
    .catch(null)
    .transform((v) => v ?? null),
  location: nullableString(200),
  experienceMin: z
    .number()
    .int()
    .min(0)
    .max(50)
    .nullish()
    .catch(null)
    .transform((v) => v ?? null),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(12).catch([]),
  requirements: z
    .array(
      z.object({
        type: z.enum(["required", "preferred"]).catch("required"),
        category: z.enum(["skill", "experience", "education", "other"]).catch("skill"),
        label: z.string().trim().min(1).max(120),
      }),
    )
    .max(15)
    .catch([]),
});

export type DraftJob = z.infer<typeof draftJobSchema>;

export const BRIEF_SYSTEM = `You are a hiring manager's assistant. Turn a short, informal hiring brief into a draft job post.
Return ONLY valid JSON. No markdown, no code fences.

{
  "title": "clear job title",
  "summary": "3-5 sentence job description written to candidates",
  "employmentType": "full_time" | "part_time" | "contract" | "internship" | null,
  "workplaceType": "remote" | "hybrid" | "on_site" | null,
  "location": string or null,
  "experienceMin": integer years or null,
  "responsibilities": string[],
  "requirements": [{ "type": "required" | "preferred", "category": "skill" | "experience" | "education" | "other", "label": "short requirement" }]
}

Rules:
- Infer the role from the problem described, not from buzzwords.
- Requirements are concrete skills, tools or experience. Keep labels short (1-4 words). 3-6 required, up to 4 preferred.
- Map seniority words to experienceMin only when clear (junior ~0-1, mid ~3, senior ~5). Otherwise null.
- Do not invent salary, company name or benefits.`;

export function extractJsonObject(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}

export type TextGenerator = (input: {
  system: string;
  user: string;
}) => Promise<string>;

export type DraftResult =
  | { ok: true; draft: DraftJob }
  | { ok: false; status: 400 | 502; error: string };

/** Calls the model (injected so tests can mock it) and validates its JSON. */
export async function draftJobFromBrief(
  brief: string,
  generate: TextGenerator,
): Promise<DraftResult> {
  const text = brief.trim();
  if (text.length < BRIEF_MIN) {
    return { ok: false, status: 400, error: "Describe the role in a sentence or two." };
  }
  let raw: string;
  try {
    raw = await generate({ system: BRIEF_SYSTEM, user: text.slice(0, BRIEF_MAX) });
  } catch {
    return { ok: false, status: 502, error: "The agent could not draft the job. Try again." };
  }
  const parsed = draftJobSchema.safeParse(extractJsonObject(raw));
  if (!parsed.success) {
    return { ok: false, status: 502, error: "The agent returned an unusable draft. Try again." };
  }
  // Drop duplicate requirement labels (case-insensitive).
  const seen = new Set<string>();
  const requirements = parsed.data.requirements.filter((r) => {
    const key = r.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ok: true, draft: { ...parsed.data, requirements } };
}

/** Draft → body for the existing POST /api/jobs/org/:orgSlug route. */
export function draftToJobInput(draft: DraftJob) {
  return {
    title: draft.title,
    description: draft.summary,
    employmentType: draft.employmentType,
    workplaceType: draft.workplaceType,
    location: draft.location,
    experienceMin: draft.experienceMin,
    responsibilities: draft.responsibilities.length
      ? draft.responsibilities.map((r) => `- ${r}`).join("\n")
      : null,
    requirements: draft.requirements.map((r, i) => ({ ...r, sortOrder: i })),
  };
}
