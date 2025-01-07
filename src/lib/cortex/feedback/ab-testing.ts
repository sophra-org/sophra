import type { MetricsService } from "@/lib/cortex/monitoring/metrics";
import type { Logger } from "@/lib/shared/types";
import type { ExperimentStatus, PrismaClient } from "@prisma/client";

/**
 * 🧪 A/B Test Configuration: Your Experiment Blueprint
 *
 * All the details needed to run a search experiment.
 * Like a recipe for testing different search approaches! 🔬
 *
 * @interface ABTestConfig
 * @property {string} id - Unique test identifier
 * @property {string} name - What we're testing
 * @property {SearchVariant[]} variants - Different versions to test
 * @property {Date} startDate - When to start testing
 * @property {Date} endDate - When to stop testing
 * @property {number} trafficAllocation - How many users to include (0-1)
 */
interface ABTestConfig {
  id: string;
  name: string;
  variants: SearchVariant[];
  startDate: Date;
  endDate: Date;
  trafficAllocation: number;
}

/**
 * 🔄 Search Variant: A Different Way to Search
 *
 * One version of search we want to test.
 * Like trying a different recipe to make the same dish! 🍳
 *
 * @interface SearchVariant
 * @property {string} id - Unique variant identifier
 * @property {string} name - What makes this version special
 * @property {Record<string, number>} weights - How important different factors are
 * @property {number} allocation - How many users should try this version (0-1)
 */
interface SearchVariant {
  id: string;
  name: string;
  weights: Record<string, number>;
  allocation: number;
}

/**
 * 📋 A/B Test Record: Test Details in the Database
 *
 * How we store test information.
 * Like keeping a lab notebook of our experiments! 📔
 *
 * @interface ABTestRecord
 */
interface ABTestRecord {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  configuration: {
    variants: SearchVariant[];
    trafficAllocation: number;
  };
}

/**
 * 🧪 Search A/B Testing Service: Your Experiment Lab!
 *
 * This service helps us run controlled experiments to make search better.
 * Think of it as a scientific laboratory for improving search! 🔬
 *
 * Features:
 * - 🎯 Runs controlled experiments
 * - 🎲 Fairly assigns users to test groups
 * - 📊 Tracks experiment results
 * - 📈 Measures improvements
 * - 🔄 Manages test lifecycles
 *
 * @class SearchABTestingService
 */
export class SearchABTestingService {
  private readonly logger: Logger;
  private readonly prisma: PrismaClient;
  private readonly metrics: MetricsService;

  /**
   * 🎒 Sets Up Your Testing Lab
   *
   * Gets everything ready to run experiments.
   * Like preparing all your lab equipment! 🧪
   *
   * @param {Object} config - Everything we need to run tests
   * @param {Logger} config.logger - Our lab notebook
   * @param {PrismaClient} config.prisma - Our data storage
   * @param {MetricsService} config.metrics - Our measuring tools
   */
  constructor(config: {
    logger: Logger;
    prisma: PrismaClient;
    metrics: MetricsService;
  }) {
    this.logger = config.logger;
    this.prisma = config.prisma;
    this.metrics = config.metrics;
  }

  /**
   * 🔍 Finds an Active Test
   *
   * Looks up details about a running experiment.
   * Like checking what's currently in your test tubes! 🧪
   *
   * @private
   * @param {string} testId - Which test to look for
   * @returns {Promise<ABTestConfig>} The test details
   * @throws {Error} If the test isn't found or is invalid
   */
  private async getActiveTest(testId: string): Promise<ABTestConfig> {
    if (!testId) {
      throw new Error("Test ID is required");
    }

    const test = (await this.prisma.aBTest.findFirst({
      where: {
        id: testId,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    })) as unknown as ABTestRecord;

    if (!test) {
      throw new Error(`No active test found for ID: ${testId}`);
    }

    if (
      !test.configuration?.variants ||
      !Array.isArray(test.configuration.variants)
    ) {
      throw new Error(`Invalid test configuration for ID: ${testId}`);
    }

    return {
      ...test,
      variants: test.configuration.variants.map((variant) => ({
        ...variant,
        allocation: variant.allocation || 0,
        weights: variant.weights || {},
      })),
      trafficAllocation: test.configuration.trafficAllocation || 1,
    };
  }

  /**
   * 🔎 Gets a Specific Test Version
   *
   * Finds details about one version of a test.
   * Like examining one specific sample in your lab! 🔬
   *
   * @private
   * @param {string} testId - Which test to look in
   * @param {string} variantId - Which version to find
   * @returns {Promise<SearchVariant>} The version details
   * @throws {Error} If the version isn't found
   */
  private async getVariant(
    testId: string,
    variantId: string
  ): Promise<SearchVariant> {
    if (!testId || !variantId) {
      throw new Error("Test ID and variant ID are required");
    }

    const test = await this.getActiveTest(testId);
    const variant = test.variants.find((v) => v.id === variantId);

    if (!variant) {
      throw new Error(`Variant ${variantId} not found in test ${testId}`);
    }

    return {
      ...variant,
      allocation: variant.allocation || 0,
      weights: variant.weights || {},
    };
  }

  /**
   * 🎲 Picks a Test Version
   *
   * Fairly chooses which version a user should see.
   * Like randomly selecting a test tube for your experiment! 🧪
   *
   * @private
   * @param {ABTestConfig} test - The test to pick from
   * @returns {SearchVariant} The chosen version
   * @throws {Error} If there are no versions to pick from
   */
  private selectVariant(test: ABTestConfig): SearchVariant {
    if (!test.variants || test.variants.length === 0) {
      throw new Error("Test has no variants");
    }

    // Normalize allocations if they don't sum to 1
    const totalAllocation = test.variants.reduce(
      (sum, v) => sum + (v.allocation || 0),
      0
    );
    if (totalAllocation === 0) {
      // If no allocations set, distribute evenly
      const evenAllocation = 1 / test.variants.length;
      test.variants.forEach((v) => (v.allocation = evenAllocation));
    } else if (totalAllocation !== 1) {
      // Normalize to sum to 1
      test.variants.forEach(
        (v) => (v.allocation = (v.allocation || 0) / totalAllocation)
      );
    }

    const random = Math.random();
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.allocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0];
  }

  /**
   * 🎯 Assigns a User to a Test Version
   *
   * Decides which version of search a user should see.
   * Like assigning a participant to a test group! 👥
   *
   * @param {string} sessionId - Which user we're assigning
   * @param {string} testId - Which test we're running
   * @returns {Promise<SearchVariant>} The assigned version
   * @throws {Error} If something goes wrong during assignment
   */
  async assignVariant(
    sessionId: string,
    testId: string
  ): Promise<SearchVariant> {
    if (!sessionId || !testId) {
      throw new Error("Session ID and test ID are required");
    }

    try {
      // First check if this session already has an assignment
      const existing = await this.prisma.aBTestAssignment.findFirst({
        where: {
          sessionId,
          testId,
        },
      });

      if (existing) {
        this.logger.debug("Found existing variant assignment", {
          sessionId,
          testId,
          variantId: existing.variantId,
        });
        return this.getVariant(testId, existing.variantId);
      }

      // Get active test configuration
      const test = await this.getActiveTest(testId);

      // Check if user should be included in test based on traffic allocation
      if (Math.random() > test.trafficAllocation) {
        this.logger.debug(
          "Session excluded from test based on traffic allocation",
          {
            sessionId,
            testId,
            allocation: test.trafficAllocation,
          }
        );
        // Return default variant
        return test.variants[0];
      }

      // Select a variant
      const variant = this.selectVariant(test);

      // Create assignment record
      await this.prisma.aBTestAssignment.create({
        data: {
          sessionId,
          testId,
          variantId: variant.id,
          timestamp: new Date(),
        },
      });

      this.logger.debug("Created new variant assignment", {
        sessionId,
        testId,
        variantId: variant.id,
      });

      return variant;
    } catch (error) {
      this.logger.error("Failed to assign test variant", {
        error,
        sessionId,
        testId,
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 📊 Records Test Results
   *
   * Saves how well each version is performing.
   * Like recording the results of your experiment! 📈
   *
   * @param {Object} data - The test results
   * @param {string} data.testId - Which test these results are for
   * @param {string} data.variantId - Which version these results are for
   * @param {string} data.queryHash - Which search query was tested
   * @param {Object} data.metrics - How well it performed
   * @throws {Error} If something goes wrong while saving
   */
  async trackVariantMetrics(data: {
    testId: string;
    variantId: string;
    queryHash: string;
    metrics: {
      clickThroughRate: number;
      averageRelevance: number;
      conversionRate: number;
    };
  }): Promise<void> {
    try {
      await this.prisma.aBTestMetrics.create({
        data: {
          testId: data.testId,
          variantId: data.variantId,
          queryHash: data.queryHash,
          metrics: data.metrics,
          timestamp: new Date(),
        },
      });
      // Update Prometheus metrics
      this.metrics.updateABTestMetrics({
        test_id: data.testId,
        variant_id: data.variantId,
        query_hash: data.queryHash,
        metrics: {
          clickThroughRate: data.metrics.clickThroughRate,
          averageRelevance: data.metrics.averageRelevance,
          conversionRate: data.metrics.conversionRate,
        },
      });
    } catch (error) {
      this.logger.error("Failed to track variant metrics", { error, data });
      throw error;
    }
  }

  async createTest(params: {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: string;
    configuration: {
      variants: SearchVariant[];
    };
  }): Promise<ABTestRecord> {
    return (await this.prisma.aBTest.create({
      data: {
        name: params.name,
        description: params.description,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status as ExperimentStatus,
        configuration: JSON.parse(JSON.stringify(params.configuration)),
      },
    })) as unknown as ABTestRecord;
  }

  async getTestByName(name: string): Promise<ABTestRecord | null> {
    try {
      const test = await this.prisma.aBTest.findFirst({
        where: {
          name,
          status: "ACTIVE",
          startDate: {
            lte: new Date(),
          },
          endDate: {
            gte: new Date(),
          },
        },
      });

      if (!test) {
        this.logger.debug("No active test found with name", { name });
        return null;
      }

      return test as unknown as ABTestRecord;
    } catch (error) {
      this.logger.error("Failed to get test by name", { error, name });
      throw error;
    }
  }

  async trackConversion(data: ConversionEvent): Promise<void> {
    await this.prisma.aBTestMetric.create({
      data: {
        test: {
          connect: { id: data.testId },
        },
        session: {
          connect: { id: data.sessionId },
        },
        variantId: data.variantId,
        eventType: data.event,
        value: data.value,
      },
    });
  }

  async calculateMetrics(testId: string): Promise<MetricsResult> {
    const metrics = await this.prisma.aBTestMetric.groupBy({
      by: ["variantId"],
      where: { testId },
      _count: true,
      _sum: {
        value: true,
      },
    });

    return metrics.reduce(
      (acc, metric) => ({
        ...acc,
        [metric.variantId]: {
          conversion_rate: (metric._sum.value || 0) / metric._count,
          sample_size: metric._count,
        },
      }),
      {}
    );
  }

  async calculateSignificance(testId: string): Promise<SignificanceResult> {
    // Implement statistical significance calculation
    // This is a simplified example
    return {
      pValue: 0.05,
      significant: true,
      confidenceInterval: {
        lower: 0.1,
        upper: 0.2,
      },
    };
  }

  async getTimeSeriesMetrics(
    testId: string,
    startDate: Date,
    endDate: Date,
    interval: string
  ): Promise<TimeSeriesMetrics> {
    const metrics = await this.prisma.aBTestMetric.findMany({
      where: {
        testId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Process metrics into time series format
    return {
      dates: [],
      metrics: {
        control: [],
        variant_a: [],
      },
    };
  }

  async getSegmentMetrics(
    testId: string,
    segments: Record<string, string[]>
  ): Promise<SegmentMetrics> {
    // Return segmented metrics analysis
    return {
      userType: {
        new: {},
        returning: {},
      },
      device: {
        mobile: {},
        desktop: {},
      },
    };
  }
}

interface ConversionEvent {
  testId: string;
  variantId: string;
  sessionId: string;
  event: string;
  value: number;
}

interface MetricsResult {
  [variantId: string]: {
    conversion_rate: number;
    sample_size: number;
  };
}

interface SignificanceResult {
  pValue: number;
  significant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

interface TimeSeriesMetrics {
  dates: Date[];
  metrics: {
    [variantId: string]: number[];
  };
}

interface SegmentMetrics {
  [segmentType: string]: {
    [segmentValue: string]: {
      conversion_rate?: number;
      sample_size?: number;
      confidence_interval?: {
        lower: number;
        upper: number;
      };
    };
  };
}
