import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import { SearchABTestingService } from "@/lib/cortex/feedback/ab-testing";
import { AutomatedFeedbackProcessor } from "@/lib/cortex/feedback/automated-processor";
import { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { prisma } from "@/lib/shared/database/client";
import type { Logger } from "@/lib/shared/types";
import { JsonValue } from "@prisma/client/runtime/library";
/**
 * 📝 Search Feedback Data: What Users Think About Search Results
 *
 * This is like a report card from users about how well our search is working.
 * It helps us understand if people are finding what they need! 📊
 *
 * @interface SearchFeedbackData
 * @property {string} searchId - Which search this feedback is for
 * @property {string} queryHash - A unique ID for the search query
 * @property {string} resultId - Which result they're giving feedback on
 * @property {number} relevanceScore - How relevant the result was (like a grade!)
 * @property {'clicked' | 'ignored' | 'converted'} userAction - What the user did
 * @property {Record<string, unknown>} metadata - Extra details about the feedback
 */
interface SearchMetadata {
  testId?: string;
  variantId?: string;
  [key: string]: unknown;
}

interface SearchMetrics {
  clickThroughRate: number;
  averageRelevance: number;
  conversionRate: number;
}

interface ABTestMetrics {
  relevance: number;
  action: 'clicked' | 'ignored' | 'converted';
}

export interface SearchFeedbackData {
  searchId: string;
  queryHash: string;
  resultId: string;
  relevanceScore: number;
  userAction: "clicked" | "ignored" | "converted";
  metadata: SearchMetadata;
}

/**
 * 📊 Feedback Statistics: The Big Picture of User Feedback
 *
 * A summary of how well our search is performing based on user actions.
 * Like a report card for our entire search system! 📈
 *
 * @interface FeedbackStats
 * @property {number} clickThroughRate - How often users click results
 * @property {number} averageRelevance - How relevant results usually are
 * @property {number} conversionRate - How often users find what they need
 */
interface FeedbackStats {
  clickThroughRate: number;
  averageRelevance: number;
  conversionRate: number;
}

/**
 * 🎯 Feedback Service: Your Search Quality Guardian!
 *
 * This service helps us understand and improve search quality based on user feedback.
 * Think of it as a teacher collecting and analyzing student feedback to make the class better! 📚
 *
 * Features:
 * - 📝 Collects user feedback
 * - 📊 Calculates statistics
 * - 🤖 Processes feedback automatically
 * - 🔬 Runs A/B tests
 * - 📈 Tracks metrics
 *
 * Works with:
 * - 🗄️ Database (Prisma)
 * - 📝 Logger
 * - 🔍 Elasticsearch
 * - 📊 Metrics Service
 * - 🤖 Automated Processor
 * - 🔬 A/B Testing Service
 */
export class FeedbackService {
  private readonly prisma: typeof prisma;
  private readonly logger: Logger;
  private readonly metrics: MetricsService;
  private readonly automatedProcessor: AutomatedFeedbackProcessor;
  private readonly abTesting: SearchABTestingService;

  /**
   * 🎒 Sets Up the Feedback Collection System
   *
   * Gets everything ready to collect and process user feedback.
   * Like setting up suggestion boxes all around the library! 📫
   *
   * @param {Object} config - Everything we need to get started
   * @param {PrismaClient} config.prisma - Our database connection
   * @param {Logger} config.logger - Our note-taker
   * @param {ElasticsearchService} config.elasticsearch - Our search service
   */
  constructor(config: {
    prisma: typeof prisma;
    logger: Logger;
    elasticsearch: ElasticsearchService;
  }) {
    this.prisma = config.prisma;
    this.logger = config.logger;
    this.metrics = new MetricsService({ 
      logger: this.logger,
      environment: process.env.NODE_ENV || 'development'
    });
    this.automatedProcessor = new AutomatedFeedbackProcessor({
      logger: this.logger,
      prisma: this.prisma,
      elasticsearch: config.elasticsearch,
      metrics: this.metrics,
    });
    this.abTesting = new SearchABTestingService({
      logger: this.logger,
      prisma: this.prisma,
      metrics: this.metrics,
    });
  }

  /**
   * 📊 Calculates Feedback Statistics
   *
   * Crunches the numbers to see how well our search is doing.
   * Like a teacher grading tests to see how well the class is learning! 📚
   *
   * @private
   * @param {PrismaClient['searchEvent']['payload']['default'][]} feedback - All the feedback to analyze
   * @returns {FeedbackStats} A summary of how we're doing
   */
  private calculateFeedbackStats(
    feedback: Array<{
      id: string;
      filters: JsonValue;
    }>
  ): FeedbackStats {
    const total = feedback.length;
    if (total === 0) {
      return { clickThroughRate: 0, averageRelevance: 0, conversionRate: 0 };
    }

    const clicks = feedback.filter((f) => {
      const filters = f.filters as Record<string, unknown>;
      return filters?.userAction === "clicked";
    }).length;

    return {
      clickThroughRate: clicks / total,
      averageRelevance: this.calculateAverageRelevance(feedback),
      conversionRate: this.calculateConversionRate(feedback),
    };
  }

  /**
   * 📝 Records User Feedback
   *
   * Saves what users think about search results.
   * Like keeping a diary of what works and what doesn't! 📖
   *
   * @param {SearchFeedbackData} feedback - What the user thought
   * @throws {Error} If something goes wrong while saving
   */
  async recordFeedback(feedback: SearchFeedbackData): Promise<void> {
    // Validate feedback data
    if (feedback.relevanceScore < 0 || feedback.relevanceScore > 1) {
      throw new Error('Invalid feedback data: relevance score must be between 0 and 1');
    }

    try {
      await this.prisma.searchEvent.update({
        where: { id: feedback.searchId },
        data: {
          filters: {
            set: {
              userAction: feedback.userAction,
              relevanceScore: feedback.relevanceScore,
              metadata: feedback.metadata,
            } as JsonValue,
          },
        },
      });

      await this.metrics.observeSearchFeedback(feedback);
    } catch (error) {
      this.logger.error('Failed to record feedback', { error, feedback });
      throw error;
    }
  }

  /**
   * 📊 Calculates Average Relevance Score
   *
   * Figures out how relevant our results usually are.
   * Like getting the class average on a test! 📈
   *
   * @private
   * @param {PrismaClient['searchEvent']['payload']['default'][]} feedback - All feedback to analyze
   * @returns {number} The average relevance score
   */
  private calculateAverageRelevance(
    feedback: Array<{
      id: string;
      filters: JsonValue;
    }>
  ): number {
    if (feedback.length === 0) return 0;
    const totalRelevance = feedback.reduce((sum, f) => {
      const filters = f.filters as Record<string, unknown>;
      return sum + ((filters?.relevanceScore as number) || 0);
    }, 0);
    return totalRelevance / feedback.length;
  }

  /**
   * 🎯 Calculates Success Rate
   *
   * Figures out how often users find exactly what they need.
   * Like tracking how many students pass the exam! 🎓
   *
   * @private
   * @param {PrismaClient['searchEvent']['payload']['default'][]} feedback - All feedback to analyze
   * @returns {number} The conversion rate
   */
  private calculateConversionRate(
    feedback: Array<{
      id: string;
      filters: JsonValue;
    }>
  ): number {
    if (feedback.length === 0) return 0;
    const conversions = feedback.filter((f) => {
      const filters = f.filters as Record<string, unknown>;
      return filters?.userAction === "converted";
    }).length;
    return conversions / feedback.length;
  }

  /**
   * 🚀 Records Feedback and Optimizes Search
   *
   * Not only saves feedback but also uses it to make search better right away!
   * Like a teacher adjusting their teaching style based on student questions! 📚
   *
   * @param {SearchFeedbackData} feedback - What the user thought
   * @throws {Error} If something goes wrong during processing
   */
  async recordFeedbackWithOptimization(
    feedback: SearchFeedbackData & { testData?: { variantId?: string } }
  ): Promise<void> {
    // Validate test data first if present
    if (feedback.metadata?.testId && !feedback.metadata?.variantId) {
      throw new Error('Invalid test data: missing variantId');
    }

    this.logger.debug('Recording feedback with optimization', { feedback });

    // Record the feedback first
    await this.recordFeedback(feedback);

    // Track A/B test metrics if test data is present
    const metadata = feedback.metadata as SearchMetadata;
    if (metadata.testId && metadata.variantId) {
      // Calculate metrics based on user action and relevance score
      const clickThroughRate = feedback.userAction === 'clicked' ? 1 : 0;
      const conversionRate = feedback.userAction === 'converted' ? 1 : 0;

      await this.abTesting.trackVariantMetrics({
        testId: metadata.testId,
        variantId: metadata.variantId,
        queryHash: feedback.queryHash,
        metrics: {
          clickThroughRate,
          averageRelevance: feedback.relevanceScore,
          conversionRate
        }
      });
    }

    // Trigger automated optimization
    try {
      await this.automatedProcessor.processRealTimeFeedback(feedback.queryHash);
    } catch (error) {
      this.logger.error('Failed to process feedback for optimization', { error });
      throw error;
    }
  }
}
