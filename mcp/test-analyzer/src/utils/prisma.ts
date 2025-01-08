import { PrismaClient } from "../../../../prisma/test-analyzer-client";

// Configure PrismaClient with pooling settings
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_ANALYZER_DATABASE_URL,
      },
    },
    // Configure connection pooling
    log: ["query", "error", "warn"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Handle connection errors
prisma.$on("error" as never, (e) => {
  console.error("Prisma Client error:", e);
});

// Gracefully disconnect on process termination
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export { prisma };
export type { PrismaClientSingleton };
