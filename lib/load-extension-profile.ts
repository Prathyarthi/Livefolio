import { getAppOrigin, getPortfolioPublicUrl } from "@/lib/domain";
import { toExtensionProfile } from "@/lib/extension-profile";
import { prisma } from "@/lib/prisma";
import { isR2Configured, readObject } from "@/lib/r2";
import { getSession } from "@/lib/session";

export async function loadExtensionProfile(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return { status: 401 as const, body: { error: "Unauthorized" } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true },
  });
  if (!user) {
    return { status: 401 as const, body: { error: "Unauthorized" } };
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.userId },
    include: {
      experiences: { orderBy: { sortOrder: "asc" } },
      educations: { orderBy: { sortOrder: "asc" } },
      skills: { orderBy: { sortOrder: "asc" } },
      projects: { orderBy: { sortOrder: "asc" } },
      socialProfiles: true,
      certifications: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!portfolio) {
    return { status: 404 as const, body: { error: "Portfolio not found" } };
  }

  return {
    status: 200 as const,
    body: {
      ...toExtensionProfile({
        user,
        portfolio,
        origin: getAppOrigin(),
        portfolioUrl: portfolio.slug ? getPortfolioPublicUrl(portfolio.slug) : null,
      }),
      ...(portfolio.resumeUrl
        ? { resumeUrl: `${getAppOrigin()}/api/extension/resume` }
        : {}),
    },
  };
}

export async function loadExtensionResume(request: Request): Promise<Response> {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isR2Configured()) {
    return Response.json({ error: "File storage is not configured" }, { status: 503 });
  }

  const file = await prisma.storedFile.findFirst({
    where: { userId: session.userId, kind: "resume" },
    orderBy: { createdAt: "desc" },
  });
  if (!file) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  const object = await readObject(file.key);
  if (!object) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  return new Response(Buffer.from(object.body), {
    headers: {
      "content-type": object.contentType || "application/pdf",
      "content-disposition": 'attachment; filename="resume.pdf"',
      "cache-control": "no-store",
    },
  });
}
