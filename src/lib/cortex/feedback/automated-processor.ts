import type { ElasticsearchService } from "@/lib/cortex/elasticsearch/services";
import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import { SearchEvent } from "@/lib/shared/database/validation/generated";
import type { Logger } from "@/lib/shared/types";
import type { PrismaClient } from "@prisma/client";
import {
  LearningEvent,
  LearningEventType,
  LearningPattern,
} from "@prisma/client";
import type { SearchFeedbackData } from "./service";

/**
 * ⚙️ Automated Processor Configuration
 *
 * Everything our automated helper needs to do its job.
 * Like giving a robot all its tools and instructions! 🤖
 *
 * @interface AutomatedProcessorConfig
 * @property {Logger} logger - Takes notes about what's happening
 * @property {PrismaClient} prisma - Stores and retrieves data
 * @property {ElasticsearchService} elasticsearch - Handles search operations
 * @property {MetricsService} metrics - Tracks performance
 */
interface AutomatedProcessorConfig {
  logger: Logger;
  prisma: PrismaClient;
  elasticsearch: ElasticsearchService;
  metrics: MetricsService;
}

/**
 * 📊 Feedback Metrics: How Well Search is Working
 *
 * A collection of numbers that tell us if search is doing a good job.
 * Like a report card for our search system! 📈
 *
 * @interface FeedbackMetrics
 * @property {number} clickThroughRate - How often people click results
 * @property {number} averageRelevance - How good the results usually are
 * @property {number} conversionRate - How often people find what they need
 * @property {boolean} requiresAdjustment - If we need to make changes
 */
interface FeedbackMetrics {
  clickThroughRate: number;
  averageRelevance: number;
  conversionRate: number;
  requiresAdjustment: boolean;
}

/**
 * 🤖 Automated Feedback Processor: Your Smart Search Assistant!
 *
 * This service automatically improves search based on how people use it.
 * Like having a robot librarian that learns from experience! 📚
 *
 * Features:
 * - 📊 Analyzes user feedback
 * - 🔄 Makes real-time adjustments
 * - 📈 Tracks performance metrics
 * - 🎯 Improves search accuracy
 * - 🔧 Auto-tunes search settings
 *
 * @class AutomatedFeedbackProcessor
 */
export class AutomatedFeedbackProcessor {
  private readonly logger: Logger;
  private readonly prisma: PrismaClient;
  private readonly elasticsearch: ElasticsearchService;
  private readonly metrics: MetricsService;

  /**
   * 🎒 Sets Up Your Smart Assistant
   *
   * Gets the automated processor ready to help improve search.
   * Like booting up your helpful robot friend! 🤖
   *
   * @param {AutomatedProcessorConfig} config - Everything needed to work
   */
  constructor(config: AutomatedProcessorConfig) {
    this.logger = config.logger;
    this.prisma = config.prisma;
    this.elasticsearch = config.elasticsearch;
    this.metrics = config.metrics;
  }

  /**
   * ⚡ Processes Feedback in Real-Time
   *
   * Quickly learns from how people are using search right now.
   * Like having a librarian who instantly learns from every visitor! 📚
   *
   * @param {string} searchId - Which search to analyze
   * @throws {Error} If something goes wrong during processing
   */
  async processRealTimeFeedback(searchId: string): Promise<void> {
    try {
      const recentFeedback = await this.prisma.searchEvent.findMany({
        where: {
          id: searchId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          query: true,
          timestamp: true,
          filters: true,
          sessionId: true,
          searchType: true,
          totalHits: true,
          took: true,
          facetsUsed: true,
          resultIds: true,
          page: true,
          pageSize: true,
        },
      });

      const feedbackData = this.mapPrismaToFeedbackData(recentFeedback);
      const metrics = this.calculateFeedbackMetrics(feedbackData);

      if (metrics.requiresAdjustment) {
        await this.adjustWeights(searchId, metrics);
      }

      this.metrics.updateSearchQuality({
        relevance: metrics.averageRelevance,
        conversion_rate: metrics.conversionRate,
        click_through_rate: metrics.clickThroughRate,
      });
    } catch (error) {
      this.logger.error("Failed to process real-time feedback", {
        error,
        searchId,
      });
      throw error;
    }
  }

  /**
   * 📊 Calculates Performance Metrics
   *
   * Crunches numbers to see how well search is working.
   * Like getting a report card for our search system! 📈
   *
   * @private
   * @param {SearchFeedbackData[]} feedback - User feedback to analyze
   * @returns {FeedbackMetrics} How well search is performing
   */
  private calculateFeedbackMetrics(
    feedback: SearchFeedbackData[]
  ): FeedbackMetrics {
    if (feedback.length === 0) {
      return {
        clickThroughRate: 0,
        averageRelevance: 0,
        conversionRate: 0,
        requiresAdjustment: false,
      };
    }

    const clicks = feedback.filter((f) => f.userAction === "clicked").length;
    const conversions = feedback.filter(
      (f) => f.userAction === "converted"
    ).length;
    const totalRelevance = feedback.reduce(
      (sum, f) => sum + f.relevanceScore,
      0
    );
    const total = feedback.length;

    const metrics = {
      clickThroughRate: clicks / total,
      averageRelevance: totalRelevance / total,
      conversionRate: conversions / total,
      requiresAdjustment: false,
    };

    metrics.requiresAdjustment =
      metrics.clickThroughRate < 0.2 || metrics.averageRelevance < 0.5;

    return metrics;
  }

  /**
   * 🔧 Adjusts Search Settings
   *
   * Changes how search works based on performance metrics.
   * Like fine-tuning a machine to work better! ⚙️
   *
   * @private
   * @param {string} searchId - Which search to adjust
   * @param {FeedbackMetrics} metrics - Current performance numbers
   * @throws {Error} If adjustments can't be made
   */
  private async adjustWeights(
    searchId: string,
    metrics: FeedbackMetrics
  ): Promise<void> {
    try {
      const currentWeights =
        await this.elasticsearch.getSearchWeights(searchId);
      const adjustedWeights = this.computeWeightAdjustments(
        currentWeights,
        metrics
      );

      await this.elasticsearch.updateWeights(searchId, adjustedWeights);

      this.logger.info("Search weights adjusted", {
        searchId,
        metrics,
        adjustedWeights,
      });
    } catch (error) {
      this.logger.error("Failed to adjust weights", {
        error,
        searchId,
        metrics,
      });
      throw error;
    }
  }

  /**
   * 🔄 Converts Database Data to Feedback
   *
   * Transforms raw database records into useful feedback data.
   * Like translating notes into actionable insights! 📝
   *
   * @private
   * @param {Prisma.SearchEvent | null} prismaFeedback - Raw database records
   * @returns {SearchFeedbackData[]} Processed feedback data
   */
  private mapPrismaToFeedbackData(
    prismaFeedback: SearchEvent[] | null
  ): SearchFeedbackData[] {
    if (!prismaFeedback) return [];

    return prismaFeedback.map((feedback) => {
      const filters = feedback.filters as Record<string, unknown>;
      return {
        searchId: feedback.id,
        queryHash: feedback.id,
        resultId: feedback.id,
        relevanceScore: (filters.relevanceScore as number) || 0,
        userAction:
          (filters.userAction as SearchFeedbackData["userAction"]) || "ignored",
        metadata: filters,
      };
    });
  }

  /**
   * ⚖️ Calculates New Search Settings
   *
   * Figures out how to adjust search to work better.
   * Like a chef adjusting a recipe based on taste tests! 👨‍🍳
   *
   * @private
   * @param {Record<string, number>} currentWeights - Current search settings
   * @param {FeedbackMetrics} metrics - How well search is working
   * @returns {Record<string, number>} Adjusted search settings
   */
  private computeWeightAdjustments(
    currentWeights: Record<string, number>,
    metrics: FeedbackMetrics
  ): Record<string, number> {
    const adjustments = { ...currentWeights };

    if (metrics.clickThroughRate < 0.2) {
      adjustments.title = (currentWeights.title || 1) * 1.2;
    }

    if (metrics.averageRelevance < 0.5) {
      adjustments.content = (currentWeights.content || 1) * 1.5;
    }

    return adjustments;
  }

  async analyzeFeedback(events: LearningEvent[]): Promise<LearningPattern[]> {
    const feedbackEvents = events.filter(
      (e) => e.type === LearningEventType.USER_FEEDBACK
    );

    const patterns: LearningPattern[] = feedbackEvents.map((event) => ({
      id: `feedback_${event.id}`,
      type: "USER_FEEDBACK",
      confidence: 0.8,
      eventId: event.id,
      features: JSON.stringify({
        relevantHits:
          event.metadata && typeof event.metadata === "object"
            ? (event.metadata as Record<string, unknown>).relevantHits
            : null,
        totalHits:
          event.metadata && typeof event.metadata === "object"
            ? (event.metadata as Record<string, unknown>).totalHits
            : null,
      }),
      metadata: JSON.stringify({
        source: "feedback_analysis",
        detectedAt: new Date().toISOString(),
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return patterns;
  }
}
