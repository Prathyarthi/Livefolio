import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { normalizeOAuthEmail } from "@/lib/oauth-users";

function shouldUseSecureCookies() {
  return (
    process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
    process.env.VERCEL === "1"
  );
}

const SESSION_CACHE_TTL_MS = 5 * 60 * 1000;
const sessionCache = new Map<string, { userId: string; expiresAt: number }>();

async function resolveUserIdFromToken(token: {
  id?: unknown;
  email?: unknown;
}) {
  if (typeof token.id === "string" && token.id.length > 0) {
    return token.id;
  }

  if (typeof token.email !== "string" || !token.email.trim()) {
    return null;
  }

  const email = token.email;
  const cached = sessionCache.get(email);
  if (cached && Date.now() < cached.expiresAt) return cached.userId;

  const dbUser = await prisma.user.findUnique({
    where: { email: normalizeOAuthEmail(email) },
    select: { id: true },
  });

  if (dbUser) {
    sessionCache.set(email, { userId: dbUser.id, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
  }

  return dbUser?.id ?? null;
}

export async function getSession(request: Request) {
  const token = await getToken({
    req: request as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: shouldUseSecureCookies(),
  });

  if (!token) return null;

  const userId = await resolveUserIdFromToken(token);
  if (!userId) return null;

  return {
    userId,
    name: token.name as string | undefined,
    email: token.email as string | undefined,
  };
}
