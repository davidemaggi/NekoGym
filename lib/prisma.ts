import { mkdirSync } from "node:fs";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { DATA_DIR, SQLITE_DATABASE_URL } from "@/lib/storage-paths";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
mkdirSync(DATA_DIR, { recursive: true });

const adapter = new PrismaBetterSqlite3({
  url: SQLITE_DATABASE_URL,
});

function hasCourseDelegate(client: PrismaClient | undefined): client is PrismaClient {
  const maybeClient = client as PrismaClient & {
    course?: { findMany?: (...args: unknown[]) => unknown };
  };

  return Boolean(maybeClient?.course && typeof maybeClient.course.findMany === "function");
}

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });
}

const cachedClient = globalForPrisma.prisma;

export const prisma =
  hasCourseDelegate(cachedClient) ? cachedClient : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
