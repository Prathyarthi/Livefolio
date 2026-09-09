import { createHash } from "node:crypto";
import { generateOpenRouterText } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/db/generated/prisma/client";
import {
  heuristicSearchProfile,
  jobJdSource,
  parseJobSearchProfile,
  sanitizeExtractedProfile,
  type JobJdInput,
  type JobSearchProfile,
} from "@/features/jobs/lib/search-profile";

const EXTRACT_SYSTEM = `You extract a hiring search profile from a job description.
Return ONLY valid JSON. No markdown, no code fences.

{
  "roleFamily": "engineering" | "design" | "marketing" | "sales" | "product" | "ops" | "writing" | "general",
  "confidence": 0.0 to 1.0,
  "seniority": "intern" | "junior" | "mid" | "senior" | "staff" | "unknown",
  "minYears": number or null,
  "location": string or null,
  "workplaceType": "remote" | "hybrid" | "on_site" | null,
  "education": string or null,
  "mustHaves": string[],
  "niceToHaves": string[],
  "domains": string[],
  "responsibilities": string[],
  "digest": "2-3 sentences: what a strong candidate looks like",
  "gates": {
    "github": boolean,
    "leetcode": boolean,
    "medium": boolean,
    "liveUrl": boolean
  }
}

Rules:
- roleFamily is the job itself, not tools mentioned in passing.
- github and leetcode gates are true ONLY for hands-on software/engineering roles. Marketing, sales, HR, design, ops: false even if the JD mentions GitHub as a company tool.
- medium gate is true for writing, DevRel, or content roles.
- liveUrl gate is true for engineering or design roles where shipped work matters.
- mustHaves are real requirements (skills, tools, certs, languages). Keep them short.
- responsibilities are what the person will do, not fluff.
- domains are industries or product areas (fintech, B2B SaaS, healthcare).
- If unsure, use roleFamily "general", confidence below 0.6, and all coding gates false.`;

function sourceHash(source: string): string {
  return createHash("sha256").update(source).digest("hex").slice(0, 32);
}

function extractJsonObject(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as unknown;
  } catch {
    return null;
  }
}

export async function extractJobSearchProfile(
  job: JobJdInput,
  hash: string,
): Promise<JobSearchProfile> {
  const fallback = heuristicSearchProfile(job, hash);
  const source = jobJdSource(job);
  if (source.trim().length < 8) return fallback;

  try {
    const text = await generateOpenRouterText({
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        {
          role: "user",
          content: source.slice(0, 12000),
        },
      ],
      temperature: 0.1,
    });
    const parsed = extractJsonObject(text);
    if (!parsed) return fallback;
    return sanitizeExtractedProfile(parsed, hash, job);
  } catch {
    return fallback;
  }
}

const jobJdSelect = {
  id: true,
  title: true,
  description: true,
  responsibilities: true,
  qualifications: true,
  location: true,
  experienceMin: true,
  department: true,
  searchProfile: true,
} as const;

export async function refreshJobSearchProfile(jobId: string): Promise<JobSearchProfile> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: jobJdSelect,
  });
  if (!job) {
    return heuristicSearchProfile(
      { title: "", description: "" },
      sourceHash(""),
    );
  }

  const input: JobJdInput = {
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    location: job.location,
    experienceMin: job.experienceMin,
    department: job.department,
  };
  const hash = sourceHash(jobJdSource(input));
  const existing = parseJobSearchProfile(job.searchProfile);
  if (existing && existing.sourceHash === hash) return existing;

  const profile = await extractJobSearchProfile(input, hash);
  await prisma.job.update({
    where: { id: jobId },
    data: { searchProfile: profile as unknown as Prisma.InputJsonValue },
  });
  return profile;
}