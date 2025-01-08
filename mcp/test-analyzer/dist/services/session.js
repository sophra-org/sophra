"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const test_analyzer_client_1 = require("../../../../prisma/test-analyzer-client");
const prisma_1 = require("../utils/prisma");
class SessionManager {
    constructor() { }
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    async createSession(context = {}) {
        const session = await prisma_1.prisma.analysisSession.create({
            data: {
                status: test_analyzer_client_1.SessionStatus.ACTIVE,
                context: context,
                decisions: [],
                operations: [],
            },
        });
        return session;
    }
    async getSession(sessionId) {
        return prisma_1.prisma.analysisSession.findUnique({
            where: { id: sessionId },
            include: {
                testFiles: true,
                analyses: true,
            },
        });
    }
    async addTestFile(sessionId, testFile) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                testFiles: {
                    connect: { id: testFile.id },
                },
            },
        });
    }
    async recordOperation(sessionId, operation) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                operations: {
                    push: operation,
                },
            },
        });
    }
    async recordDecision(sessionId, decision) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                decisions: {
                    push: {
                        ...decision,
                        timestamp: new Date(),
                    },
                },
            },
        });
    }
    async pauseSession(sessionId) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                status: test_analyzer_client_1.SessionStatus.PAUSED,
            },
        });
    }
    async resumeSession(sessionId) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                status: test_analyzer_client_1.SessionStatus.ACTIVE,
            },
        });
    }
    async completeSession(sessionId) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                status: test_analyzer_client_1.SessionStatus.COMPLETED,
                endedAt: new Date(),
            },
        });
    }
    async failSession(sessionId, error) {
        await prisma_1.prisma.analysisSession.update({
            where: { id: sessionId },
            data: {
                status: test_analyzer_client_1.SessionStatus.FAILED,
                endedAt: new Date(),
                context: {
                    error: {
                        message: error.message,
                        stack: error.stack,
                    },
                },
            },
        });
    }
    async getSessionHistory(testFileId) {
        return prisma_1.prisma.analysisSession.findMany({
            where: {
                testFiles: {
                    some: {
                        id: testFileId,
                    },
                },
            },
            orderBy: {
                startedAt: "desc",
            },
            include: {
                analyses: true,
            },
        });
    }
    async getSessionOperations(sessionId) {
        const session = await prisma_1.prisma.analysisSession.findUnique({
            where: { id: sessionId },
        });
        return (session?.operations || []);
    }
    async getSessionDecisions(sessionId) {
        const session = await prisma_1.prisma.analysisSession.findUnique({
            where: { id: sessionId },
        });
        return (session?.decisions || []);
    }
    async getActiveSessionsForTestFile(testFileId) {
        return prisma_1.prisma.analysisSession.findMany({
            where: {
                testFiles: {
                    some: {
                        id: testFileId,
                    },
                },
                status: test_analyzer_client_1.SessionStatus.ACTIVE,
            },
            orderBy: {
                startedAt: "desc",
            },
        });
    }
    async cleanupStaleSessions(maxAgeHours = 24) {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - maxAgeHours);
        await prisma_1.prisma.analysisSession.updateMany({
            where: {
                status: test_analyzer_client_1.SessionStatus.ACTIVE,
                startedAt: {
                    lt: cutoff,
                },
            },
            data: {
                status: test_analyzer_client_1.SessionStatus.FAILED,
                endedAt: new Date(),
                context: {
                    error: {
                        message: "Session timed out due to inactivity",
                    },
                },
            },
        });
    }
}
exports.SessionManager = SessionManager;
