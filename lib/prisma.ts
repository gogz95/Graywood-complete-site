import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(raw: string): string {
  if (raw.startsWith("file:")) {
    const filePath = raw.replace(/^file:\/*/, "");
    // If it's already an absolute Windows path like E:/...
    if (/^[a-zA-Z]:/.test(filePath)) {
      return "file:///" + filePath.replace(/\\/g, "/");
    }
    const abs = path.resolve(process.cwd(), filePath);
    return "file:///" + abs.replace(/\\/g, "/");
  }
  return raw;
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL environment variable is not set.");

  const url = resolveDatabaseUrl(rawUrl);
  const adapter = new PrismaLibSql({ url });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Apply WAL + performance pragmas on first connect.
 * WAL mode allows concurrent reads during writes; busy_timeout prevents
 * "database is locked" errors under load.
 */
export async function applyPragmas() {
  await prisma.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
  await prisma.$executeRawUnsafe(`PRAGMA busy_timeout = 5000;`);
  await prisma.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
}

applyPragmas().catch(console.error);

export default prisma;
