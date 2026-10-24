import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  consumeExportAttempt,
  credentialsMatch,
  exportCorsHeaders,
  exportCredentialsConfigured,
  isAllowedExportOrigin,
  requestOrigin,
} from "@/lib/portfolio-export-guard";

export const dynamic = "force-dynamic";

const sectionInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  experiences: { orderBy: { sortOrder: "asc" as const } },
  educations: { orderBy: { sortOrder: "asc" as const } },
  skills: { orderBy: { sortOrder: "asc" as const } },
  projects: { orderBy: { sortOrder: "asc" as const } },
  articles: { orderBy: { sortOrder: "asc" as const } },
  socialProfiles: true,
  certifications: { orderBy: { sortOrder: "asc" as const } },
  achievements: { orderBy: { sortOrder: "asc" as const } },
  customSections: { orderBy: { sortOrder: "asc" as const } },
} as const;

function json(
  origin: string | null,
  body: unknown,
  status: number,
  extraHeaders?: HeadersInit,
) {
  const headers = new Headers(extraHeaders);
  if (origin && isAllowedExportOrigin(origin)) {
    const cors = exportCorsHeaders(origin);
    for (const [key, value] of Object.entries(cors)) {
      headers.set(key, value);
    }
  }
  return NextResponse.json(body, { status, headers });
}

export async function OPTIONS(request: Request) {
  const origin = requestOrigin(request);
  if (!exportCredentialsConfigured()) {
    return json(origin, { error: "Portfolio export is not configured." }, 503);
  }
  if (!isAllowedExportOrigin(origin)) {
    return json(null, { error: "Origin not allowed." }, 403);
  }
  return new NextResponse(null, { status: 204, headers: exportCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = requestOrigin(request);

  if (!exportCredentialsConfigured()) {
    return json(origin, { error: "Portfolio export is not configured." }, 503);
  }

  if (!isAllowedExportOrigin(origin)) {
    return json(null, { error: "Origin not allowed." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(origin, { error: "Invalid JSON body." }, 400);
  }

  const username =
    body && typeof body === "object" && "username" in body && typeof body.username === "string"
      ? body.username.trim()
      : "";
  const password =
    body && typeof body === "object" && "password" in body && typeof body.password === "string"
      ? body.password
      : "";

  const credentialsAreValid =
    username.length > 0 &&
    username.length <= 256 &&
    password.length > 0 &&
    password.length <= 256 &&
    credentialsMatch(username, password);

  if (!credentialsAreValid) {
    const attempt = await consumeExportAttempt(request);
    if (!attempt.ok) {
      if ("unavailable" in attempt) {
        return json(origin, { error: "Portfolio export is temporarily unavailable." }, 503);
      }
      return json(origin, { error: "Too many attempts. Try again later." }, 429, {
        "Retry-After": String(attempt.retryAfter),
      });
    }
    return json(origin, { error: "Invalid username or password." }, 401);
  }

  const isPublished =
    body &&
    typeof body === "object" &&
    "isPublished" in body &&
    typeof body.isPublished === "boolean"
      ? body.isPublished
      : null;

  if (isPublished === null) {
    return json(origin, { error: "isPublished must be true or false." }, 400);
  }

  const rows = await prisma.portfolio.findMany({
    where: { isPublished },
    orderBy: { updatedAt: "desc" },
    include: sectionInclude,
  });

  const portfolios = rows.map((portfolio) => {
    const { user, experiences, educations, skills, projects, articles, socialProfiles, certifications, achievements, customSections, ...profile } =
      portfolio;
    return {
      owner: user,
      profile,
      experiences,
      educations,
      skills,
      projects,
      articles,
      socialProfiles,
      certifications,
      achievements,
      customSections,
    };
  });

  return json(origin, { count: portfolios.length, isPublished, portfolios }, 200);
}
