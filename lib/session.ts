import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { normalizeOAuthEmail } from "@/lib/oauth-users";
import {
  parseAccountType,
  type AccountType,
} from "@/lib/account-type";

function shouldUseSecureCookies() {
  return (
    process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
    process.env.VERCEL === "1"
  );
}

async function resolveUserFromToken(token: {
  id?: unknown;
  email?: unknown;
  accountType?: unknown;
}) {
  if (typeof token.id === "string" && token.id.length > 0) {
    if (token.accountType) {
      return {
        userId: token.id,
        accountType: parseAccountType(token.accountType),
      };
    }

    const byId = await prisma.user.findUnique({
      where: { id: token.id },
      select: { id: true, accountType: true },
    });
    if (!byId) return null;
    return {
      userId: byId.id,
      accountType: parseAccountType(byId.accountType),
    };
  }

  if (typeof token.email !== "string" || !token.email.trim()) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: normalizeOAuthEmail(token.email) },
    select: { id: true, accountType: true },
  });

  if (!dbUser) return null;

  return {
    userId: dbUser.id,
    accountType: parseAccountType(dbUser.accountType),
  };
}

export async function getSession(
  request: Request,
  options?: { requireAccountType?: AccountType },
) {
  const token = await getToken({
    req: request as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: shouldUseSecureCookies(),
  });

  if (!token) return null;

  const resolved = await resolveUserFromToken(token);
  if (!resolved) return null;

  if (
    options?.requireAccountType &&
    resolved.accountType !== options.requireAccountType
  ) {
    return null;
  }

  return {
    userId: resolved.userId,
    name: token.name as string | undefined,
    email: token.email as string | undefined,
    accountType: resolved.accountType,
  };
}
