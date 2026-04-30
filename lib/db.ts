// =============================================================
//  BasketBest — Prisma Client Singleton
//  File: lib/db.ts
//
//  Next.js runs in watch mode during development, which causes
//  module hot-reload. Without this pattern every reload would
//  create a new PrismaClient, quickly exhausting DB connections.
// =============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
