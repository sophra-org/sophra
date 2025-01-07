import { Mock } from 'vitest';

interface BaseMethods {
    create: Mock;
    findMany: Mock;
    findUnique: Mock;
    findFirst: Mock;
    update: Mock;
    delete: Mock;
    upsert: Mock;
    count: Mock;
    groupBy: Mock;
}

interface MockPrisma {
    [key: string]: BaseMethods | Mock;
    document: BaseMethods;
    migration: BaseMethods;
    searchAnalytics: BaseMethods;
    session: BaseMethods;
    conversation: BaseMethods;
    message: BaseMethods;
    aBTest: BaseMethods;
    aBTestAssignment: BaseMethods;
    aBTestMetric: BaseMethods;
    searchFeedback: BaseMethods;
    baseEvent: BaseMethods;
    modelEvent: BaseMethods;
    processedSignal: BaseMethods;
    signalBatch: BaseMethods;
    signalPattern: BaseMethods;
    adaptationRule: BaseMethods;
    modelConfig: BaseMethods;
    modelVersion: BaseMethods;
    learningRequest: BaseMethods;
    feedbackRequest: BaseMethods;
    modelMetrics: BaseMethods;
    modelState: BaseMethods;
    searchEvent: BaseMethods;
    aBTestMetrics: BaseMethods;
    signal: BaseMethods;
    analyticsMetrics: BaseMethods;
    analyticsTrend: BaseMethods;
    performanceInsight: BaseMethods;
    analyticsReport: BaseMethods;
    adaptationSuggestion: BaseMethods;
    learningMetric: BaseMethods;
    learningEvent: BaseMethods;
    learningPattern: BaseMethods;
    engineState: BaseMethods;
    engineOperation: BaseMethods;
    engineMetric: BaseMethods;
    engineLearningResult: BaseMethods;
    engineOptimizationStrategy: BaseMethods;
    engineConfidenceScore: BaseMethods;
    searchWeights: BaseMethods;
    searchConfig: BaseMethods;
    experimentConfig: BaseMethods;
    engineRecommendation: BaseMethods;
    index: BaseMethods;
    user: BaseMethods;
    account: BaseMethods;
    authSession: BaseMethods;
    verificationToken: BaseMethods;
    apiKey: BaseMethods;
    adminToken: BaseMethods;
    sessionToSignal: BaseMethods;
    $transaction: Mock;
    $connect: Mock;
    $disconnect: Mock;
    $reset: Mock;
}

export declare const mockPrisma: MockPrisma;
