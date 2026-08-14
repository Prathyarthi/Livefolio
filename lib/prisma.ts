import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/db/generated/prisma/client";

config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const LIBPQ_ALIAS_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

function withVerifyFullSsl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode && LIBPQ_ALIAS_SSL_MODES.has(sslmode)) {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString: withVerifyFullSsl(connectionString),
    max: 10,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 30_000,
  });
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = createPool();
  }

  const adapter = new PrismaPg(globalForPrisma.pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
