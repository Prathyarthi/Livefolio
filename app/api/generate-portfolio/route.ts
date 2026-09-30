import { generateOpenRouterText } from "@/lib/openrouter";
import {
  AI_USER_CONTEXT_LIMIT_CHARS,
  guardAiRequest,
} from "@/lib/ai-request-guard";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a portfolio content generator. Given a user's description, generate a complete, realistic portfolio JSON object.

Return ONLY valid JSON matching this exact schema. No markdown, no code fences.

{
  "portfolio": {
    "title": "Full Name",
    "headline": "Professional title / role",
    "summary": "2-3 sentence professional bio",
    "avatarUrl": null,
    "contactEmail": "email or null",
    "phone": null,
    "location": "City, Country or null",
    "websiteUrl": null,
    "customization": {}
  },
  "experiences": [
    {
      "id": "exp_1",
      "company": "Company Name",
      "role": "Job Title",
      "description": "Key responsibilities and achievements — one point per line, newline-separated. A short label ending with a colon becomes a heading. No bullet characters",
      "startDate": "YYYY-MM-DD or null if unknown",
      "endDate": "YYYY-MM-DD or null if current or unknown",
      "location": "City or null if unknown"
    }
  ],
  "educations": [
    {
      "id": "edu_1",
      "institution": "University Name",
      "degree": "Degree",
      "field": "Field of Study or null",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "gpa": null
    }
  ],
  "skills": [
    { "id": "skill_1", "name": "Skill", "category": "Category", "level": null }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "Project Name",
      "description": "What it does — one point per line, newline-separated, no bullet characters",
      "imageUrl": null,
      "liveUrl": null,
      "sourceUrl": null,
      "techStack": ["Tech1", "Tech2"],
      "featured": true,
      "githubStars": null,
      "githubForks": null,
      "language": null
    }
  ],
  "articles": [],
  "socialProfiles": [
    { "platform": "github", "url": "https://github.com/username", "username": "username", "cachedStats": null }
  ],
  "certifications": [],
  "achievements": [],
  "customSections": []
}

Generate realistic, detailed content. Include 2-4 experiences, 1-2 educations, 8-15 skills across categories, and 2-4 projects. Omit dates, locations, and other fields when they are unknown — use null, do not invent them or write N/A. Do not use bullet characters (•, -, *) in description fields — separate points with newlines only; the UI adds bullets.`;

export async function POST(request: Request) {
  try {
    const guard = await guardAiRequest(request);
    if (!guard.ok) return guard.response;

    let body: unknown;
    try {
      body = await guard.request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const prompt = "prompt" in body ? body.prompt : undefined;
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const normalizedPrompt = prompt.trim();
    if (normalizedPrompt.length > AI_USER_CONTEXT_LIMIT_CHARS) {
      return NextResponse.json(
        {
          error: `Prompt must be at most ${AI_USER_CONTEXT_LIMIT_CHARS} characters`,
        },
        { status: 400 },
      );
    }

    const text = await generateOpenRouterText({
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPT}\n\nUser description:\n${normalizedPrompt}`,
        },
      ],
      temperature: 0.5,
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/, "")
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)?.[0]?.trim() ?? cleaned;
    const data = JSON.parse(jsonMatch);

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
