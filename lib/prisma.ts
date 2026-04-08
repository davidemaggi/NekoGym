import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined.");
  }

  return url;
}

const adapter = new PrismaBetterSqlite3({
  url: getDatabaseUrl(),
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

