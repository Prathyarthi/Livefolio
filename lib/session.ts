import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { normalizeOAuthEmail } from "@/lib/oauth-users";
import { shouldUseSecureCookies } from "@/lib/auth-cookies";

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

  const dbUser = await prisma.user.findUnique({
    where: { email: normalizeOAuthEmail(token.email) },
    select: { id: true },
  });

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
