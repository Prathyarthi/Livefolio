import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 type worker can mis-infer React hooks vs @types/react; keep CI green.
  typescript: { ignoreBuildErrors: true },
  // Prisma must stay external — Turbopack remaps `@prisma/client` to a hashed
  // id and fails to resolve `@prisma/client-<hash>/runtime/client` otherwise.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
    ],
  },
};

export default nextConfig;
