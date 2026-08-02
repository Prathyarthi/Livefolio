import { prisma } from "@/lib/prisma";
import { normalizeOptionalStoredUrl } from "@/lib/content-policy";
import type { AccountType } from "@/lib/account-type";

const GENERIC_OAUTH_NAMES = new Set(["GitHub User", "Google User"]);

export function normalizeOAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

type GitHubEmailRecord = {
  email: string;
  primary: boolean;
  verified: boolean;
};

export async function fetchGitHubPrimaryEmail(
  accessToken: string,
): Promise<string | null> {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Livefolio",
    },
  });

  if (!res.ok) return null;

  const emails = (await res.json()) as GitHubEmailRecord[];
  const primaryVerified = emails.find((entry) => entry.primary && entry.verified);
  if (primaryVerified) return primaryVerified.email;

  const verified = emails.find((entry) => entry.verified);
  return verified?.email ?? null;
}

export async function upsertOAuthUser(params: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  defaultName?: string;
  accountType?: AccountType;
}) {
  const email = normalizeOAuthEmail(params.email);
  const fallbackName = params.defaultName ?? "User";
  const accountType = params.accountType ?? "portfolio";
  let avatar: string | null = null;
  try {
    avatar = normalizeOptionalStoredUrl(params.avatar, "OAuth avatar URL");
  } catch {
    // Authentication should still succeed if a provider returns an unsafe image URL.
  }
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        name: params.name?.trim() || fallbackName,
        email,
        password: "",
        avatar: avatar ?? undefined,
        accountType,
      },
    });
  }

  return prisma.user.update({
    where: { email },
    data: {
      ...(avatar && !existing.avatar ? { avatar } : {}),
      ...(params.name?.trim() &&
      (GENERIC_OAUTH_NAMES.has(existing.name) || !existing.name.trim())
        ? { name: params.name.trim() }
        : {}),
      ...(existing.accountType !== accountType ? { accountType } : {}),
    },
  });
}
