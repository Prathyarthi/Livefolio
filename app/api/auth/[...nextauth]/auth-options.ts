import { type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
// import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
// import { comparePassword } from "@/lib/auth";
import { createGitHubProvider, createGoogleProvider } from "@/lib/auth-providers";
import {
  fetchGitHubPrimaryEmail,
  normalizeOAuthEmail,
  upsertOAuthUser,
} from "@/lib/oauth-users";
import { linkOAuthSocialProfile } from "@/lib/oauth-social-profile";

const githubProvider = createGitHubProvider();
const googleProvider = createGoogleProvider();

const OAUTH_PROVIDERS = new Set(["github", "google"]);

async function syncOAuthUser(
  provider: string,
  user: { id?: string; email?: string | null; name?: string | null; image?: string | null },
  accessToken?: string | null,
  oauthProfile?: Record<string, unknown> | null,
): Promise<string | true> {
  let email = user.email ? normalizeOAuthEmail(user.email) : null;

  if (!email && provider === "github" && accessToken) {
    const githubEmail = await fetchGitHubPrimaryEmail(accessToken);
    email = githubEmail ? normalizeOAuthEmail(githubEmail) : null;
  }

  if (!email) {
    return provider === "google"
      ? "/sign-in?error=GoogleEmailRequired"
      : "/sign-in?error=GitHubEmailRequired";
  }

  try {
    const dbUser = await upsertOAuthUser({
      email,
      name: user.name,
      avatar: user.image,
      defaultName: provider === "google" ? "Google User" : "GitHub User",
    });

    user.id = dbUser.id;
    user.email = dbUser.email;
    user.name = dbUser.name;
    if (dbUser.avatar) {
      user.image = dbUser.avatar;
    }

    await linkOAuthSocialProfile({
      userId: dbUser.id,
      provider,
      profile: oauthProfile,
      accessToken,
    });
  } catch (error) {
    console.error(`[auth] Failed to upsert ${provider} user`, error);
    return "/sign-in?error=OAuthCallback";
  }

  return true;
}

async function hydrateTokenFromDatabase(token: JWT): Promise<JWT> {
  // Prefer a live user row. Stale OAuth provider ids (or deleted UUIDs) in
  // `token.id` must not short-circuit — fall back to email lookup.
  if (typeof token.id === "string" && token.id.length > 0) {
    const byId = await prisma.user.findUnique({
      where: { id: token.id },
    });
    if (byId) {
      token.id = byId.id;
      token.email = byId.email;
      token.name = byId.name;
      token.avatar = byId.avatar ?? undefined;
      return token;
    }
    delete token.id;
  }

  const email = token.email;
  if (typeof email !== "string" || !email.trim()) {
    return token;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: normalizeOAuthEmail(email) },
  });

  if (!dbUser) return token;

  token.id = dbUser.id;
  token.email = dbUser.email;
  token.name = dbUser.name;
  token.avatar = dbUser.avatar ?? undefined;
  return token;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    ...(githubProvider ? [githubProvider] : []),
    // Email/password sign-in disabled — OAuth only.
    // CredentialsProvider({
    //   name: "Credentials",
    //   credentials: {
    //     email: { label: "Email", type: "email" },
    //     password: { label: "Password", type: "password" },
    //   },
    //   async authorize(credentials) {
    //     if (!credentials?.email || !credentials?.password) return null;
    //
    //     const user = await prisma.user.findUnique({
    //       where: { email: credentials.email },
    //     });
    //     if (!user || !user.password) return null;
    //
    //     const valid = await comparePassword(credentials.password, user.password);
    //     if (!valid) return null;
    //
    //     return {
    //       id: user.id,
    //       name: user.name,
    //       email: user.email,
    //       avatar: user.avatar ?? undefined,
    //     };
    //   },
    // }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account?.provider || !OAUTH_PROVIDERS.has(account.provider)) {
        return true;
      }

      return syncOAuthUser(
        account.provider,
        user,
        account.access_token,
        profile as Record<string, unknown> | undefined,
      );
    },
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;

        const avatar =
          (user as { avatar?: string }).avatar ??
          user.image ??
          token.avatar;
        if (avatar) token.avatar = avatar;
      }

      return hydrateTokenFromDatabase(token);
    },
    async session({ session, token }) {
      const hydrated = await hydrateTokenFromDatabase(token);

      if (hydrated.id) session.user.id = hydrated.id;
      if (hydrated.name) session.user.name = hydrated.name;
      if (hydrated.email) session.user.email = hydrated.email;
      session.user.avatar = hydrated.avatar;
      return session;
    },
  },
};
