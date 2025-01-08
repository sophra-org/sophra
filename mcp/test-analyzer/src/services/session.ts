import {
  PrismaClient,
  SessionStatus,
} from "../../../../prisma/test-analyzer-client";
import { TestFile } from "../types";

const prisma = new PrismaClient();

export interface SessionContext {
  testPattern?: string;
  coverage?: {
    current: number;
    target: number;
  };
  performance?: {
    avgDuration: number;
    maxDuration: number;
  };
  metadata?: Record<string, any>;
}

export interface SessionOperation {
  type: string;
  target: string;
  params: Record<string, any>;
  result: Record<string, any>;
  timestamp: Date;
}

export class SessionManager {
  private static instance: SessionManager;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async createSession(context: SessionContext = {}) {
    const session = await prisma.analysisSession.create({
      data: {
        status: SessionStatus.ACTIVE,
        context: context as any,
        decisions: [],
        operations: [],
      },
    });

    return session;
  }

  async getSession(sessionId: string) {
    return prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        testFiles: true,
        analyses: true,
      },
    });
  }

  async addTestFile(sessionId: string, testFile: TestFile) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        testFiles: {
          connect: { id: testFile.id },
        },
      },
    });
  }

  async recordOperation(sessionId: string, operation: SessionOperation) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        operations: {
          push: operation as any,
        },
      },
    });
  }

  async recordDecision(
    sessionId: string,
    decision: {
      type: string;
      context: Record<string, any>;
      outcome: string;
      reasoning: string;
    }
  ) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        decisions: {
          push: {
            ...decision,
            timestamp: new Date(),
          } as any,
        },
      },
    });
  }

  async pauseSession(sessionId: string) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.PAUSED,
      },
    });
  }

  async resumeSession(sessionId: string) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ACTIVE,
      },
    });
  }

  async completeSession(sessionId: string) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
  }

  async failSession(sessionId: string, error: Error) {
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.FAILED,
        endedAt: new Date(),
        context: {
          error: {
            message: error.message,
            stack: error.stack,
          },
        } as any,
      },
    });
  }

  async getSessionHistory(testFileId: string) {
    return prisma.analysisSession.findMany({
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

  async getSessionOperations(sessionId: string) {
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
    });

    return (session?.operations || []) as unknown as SessionOperation[];
  }

  async getSessionDecisions(sessionId: string) {
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
    });

    return (session?.decisions || []) as unknown as Array<{
      type: string;
      context: Record<string, any>;
      outcome: string;
      reasoning: string;
      timestamp: Date;
    }>;
  }

  async getActiveSessionsForTestFile(testFileId: string) {
    return prisma.analysisSession.findMany({
      where: {
        testFiles: {
          some: {
            id: testFileId,
          },
        },
        status: SessionStatus.ACTIVE,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
  }

  async cleanupStaleSessions(maxAgeHours = 24) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - maxAgeHours);

    await prisma.analysisSession.updateMany({
      where: {
        status: SessionStatus.ACTIVE,
        startedAt: {
          lt: cutoff,
        },
      },
      data: {
        status: SessionStatus.FAILED,
        endedAt: new Date(),
        context: {
          error: {
            message: "Session timed out due to inactivity",
          },
        } as any,
      },
    });
  }
}
