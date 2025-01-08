"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const test_analyzer_client_1 = require("../../../../prisma/test-analyzer-client");
// Configure PrismaClient with pooling settings
const prisma = new test_analyzer_client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_ANALYZER_DATABASE_URL,
        },
    },
    // Configure connection pooling
    log: ["query", "error", "warn"],
});
exports.prisma = prisma;
// Handle connection errors
prisma.$on("error", (e) => {
    console.error("Prisma Client error:", e);
});
// Gracefully disconnect on process termination
process.on("beforeExit", async () => {
    await prisma.$disconnect();
});
