import {
  TestFile as PrismaTestFile,
  TestFix as PrismaTestFix,
  TestGeneration as PrismaTestGeneration,
} from "@prisma/client";

export type TestFile = PrismaTestFile;
export type TestFix = PrismaTestFix;
export type TestGeneration = PrismaTestGeneration;

export type FixSolution = {
  fixedContent: string;
  explanation: string;
  confidence: number;
  pattern: string;
};

export type GeneratedTests = {
  tests: string;
  targetArea: string;
  strategy: string;
  gaps: string[];
};
