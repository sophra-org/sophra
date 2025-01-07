import { BaseService, BaseServiceConfig } from "@/lib/cortex/core/services";
import type { Prisma } from "@prisma/client";
import { ExperimentStatus, PrismaClient } from "@prisma/client";

export interface ABTestVariant {
  id: string;
  name: string;
  allocation: number;
  weights: Record<string, number>;
}

export interface ABTestConfig {
  variants: ABTestVariant[];
  metrics?: {
    primary: string;
    secondary: string[];
  };
}

export interface CreateABTestParams {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ExperimentStatus;
  configuration: ABTestConfig;
}

export interface ABTestAssignment {
  id: string;
  weights: Record<string, number>;
}

export interface ABTestMetrics {
  conversion_rate: number;
  sample_size: number;
}

export interface ConversionEvent {
  testId: string;
  variantId: string;
  sessionId: string;
  event: string;
  value: number;
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
  metrics: Record<string, number[]>;
}

interface SegmentMetrics {
  [segmentName: string]: {
    [value: string]: {
      conversion_rate: number;
      sample_size: number;
    };
  };
}

type ABTestWithRelations = Prisma.ABTestGetPayload<{
  include: {
    assignments: {
      select: {
        variantId: true;
        sessionId: true;
      };
    };
    metrics: {
      select: {
        variantId: true;
        eventType: true;
        timestamp: true;
        value: true;
        sessionId: true;
      };
    };
  };
}>;

export class ABTestingService extends BaseService {
  private prisma: PrismaClient;

  constructor(config: BaseServiceConfig & { environment: string }) {
    super(config);
    this.prisma = new PrismaClient();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async createTest(params: CreateABTestParams) {
    // Validate variant allocations sum to 1
    const totalAllocation = params.configuration.variants.reduce(
      (sum, variant) => sum + variant.allocation,
      0
    );
    if (Math.abs(totalAllocation - 1) > 0.001) {
      throw new Error("Variant allocations must sum to 1");
    }

    return await this.prisma.aBTest.create({
      data: {
        name: params.name,
        description: params.description || null,
        startDate: params.startDate || new Date(),
        endDate: params.endDate || new Date(),
        status: params.status || ExperimentStatus.PENDING,
        configuration: JSON.parse(JSON.stringify(params.configuration)),
      },
    });
  }

  async assignVariant(
    sessionId: string,
    testId: string
  ): Promise<ABTestAssignment | null> {
    // Check for existing assignment
    const existingAssignment = await this.prisma.aBTestAssignment.findFirst({
      where: {
        testId,
        sessionId,
      },
    });

    if (existingAssignment) {
      const test = await this.prisma.aBTest.findUnique({
        where: { id: testId },
      });
      const config = test?.configuration as unknown as ABTestConfig;
      const variant = config?.variants.find(
        (v) => v.id === existingAssignment.variantId
      );
      return variant ? { id: variant.id, weights: variant.weights } : null;
    }

    // Get test configuration
    const test = await this.prisma.aBTest.findUnique({
      where: { id: testId },
    });

    if (!test || test.status !== ExperimentStatus.ACTIVE) {
      return null;
    }

    const config = test.configuration as unknown as ABTestConfig;

    // Randomly assign variant based on allocations
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedVariant: ABTestVariant | null = null;

    for (const variant of config.variants) {
      cumulativeProbability += variant.allocation;
      if (random <= cumulativeProbability) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      return null;
    }

    // Persist assignment
    await this.prisma.aBTestAssignment.create({
      data: {
        testId,
        sessionId,
        variantId: selectedVariant.id,
        timestamp: new Date(),
      },
    });

    return {
      id: selectedVariant.id,
      weights: selectedVariant.weights,
    };
  }

  async trackConversion(params: {
    testId: string;
    variantId: string;
    sessionId: string;
    event: string;
    value: number;
  }) {
    await this.prisma.aBTestMetric.create({
      data: {
        test: {
          connect: { id: params.testId },
        },
        session: {
          connect: { id: params.sessionId },
        },
        variantId: params.variantId,
        eventType: params.event,
        value: params.value,
        timestamp: new Date(),
      },
    });
  }

  async calculateMetrics(
    testId: string
  ): Promise<Record<string, ABTestMetrics>> {
    const test = (await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        assignments: {
          select: {
            variantId: true,
            sessionId: true,
          },
        },
        metrics: {
          select: {
            variantId: true,
            eventType: true,
            timestamp: true,
            value: true,
          },
        },
      },
    })) as ABTestWithRelations;

    if (!test) {
      throw new Error("Test not found");
    }

    const config = test.configuration as unknown as ABTestConfig;
    const metrics: Record<string, ABTestMetrics> = {};

    for (const variant of config.variants) {
      const variantAssignments = test.assignments.filter(
        (a) => a.variantId === variant.id
      );
      const variantConversions = test.metrics.filter(
        (c) => c.variantId === variant.id
      );

      metrics[variant.id] = {
        conversion_rate:
          variantAssignments.length > 0
            ? variantConversions.length / variantAssignments.length
            : 0,
        sample_size: variantAssignments.length,
      };
    }

    return metrics;
  }

  async calculateSignificance(testId: string): Promise<SignificanceResult> {
    const metrics = await this.calculateMetrics(testId);
    const variants = Object.keys(metrics);

    if (variants.length < 2) {
      throw new Error(
        "Need at least two variants for significance calculation"
      );
    }

    // Simple z-test implementation
    const control = metrics[variants[0]];
    const treatment = metrics[variants[1]];

    const p1 = control.conversion_rate;
    const p2 = treatment.conversion_rate;
    const n1 = control.sample_size;
    const n2 = treatment.sample_size;

    const pooledProportion = (p1 * n1 + p2 * n2) / (n1 + n2);
    const standardError = Math.sqrt(
      pooledProportion * (1 - pooledProportion) * (1 / n1 + 1 / n2)
    );
    const zScore = Math.abs(p1 - p2) / standardError;
    const pValue = 2 * (1 - this.normalCDF(zScore));

    const marginOfError = 1.96 * standardError;

    return {
      pValue,
      significant: pValue < 0.05,
      confidenceInterval: {
        lower: p2 - p1 - marginOfError,
        upper: p2 - p1 + marginOfError,
      },
    };
  }

  async getTimeSeriesMetrics(
    testId: string,
    startDate: Date,
    endDate: Date,
    granularity: "hourly" | "daily" | "weekly" = "daily"
  ): Promise<TimeSeriesMetrics> {
    const test = (await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        metrics: {
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            variantId: true,
            timestamp: true,
            value: true,
          },
        },
      },
    })) as ABTestWithRelations;

    if (!test) {
      throw new Error("Test not found");
    }

    const config = test.configuration as unknown as ABTestConfig;
    const timeSeriesData: TimeSeriesMetrics = {
      dates: [],
      metrics: {},
    };

    // Initialize metrics for each variant
    for (const variant of config.variants) {
      timeSeriesData.metrics[variant.id] = [];
    }

    // Generate date range based on granularity
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      timeSeriesData.dates.push(new Date(currentDate));

      // Group metrics by variant and calculate conversion rate for this time period
      for (const variant of config.variants) {
        const periodMetrics = test.metrics.filter(
          (m) =>
            m.variantId === variant.id &&
            m.timestamp >= currentDate &&
            m.timestamp <
              new Date(
                currentDate.getTime() +
                  this.getGranularityMilliseconds(granularity)
              )
        );

        timeSeriesData.metrics[variant.id].push(
          periodMetrics.reduce((sum, m) => sum + m.value, 0) /
            periodMetrics.length || 0
        );
      }

      // Increment date based on granularity
      currentDate = new Date(
        currentDate.getTime() + this.getGranularityMilliseconds(granularity)
      );
    }

    return timeSeriesData;
  }

  async getSegmentMetrics(
    testId: string,
    segments: Record<string, string[]>
  ): Promise<SegmentMetrics> {
    const test = (await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        assignments: {
          select: {
            variantId: true,
            sessionId: true,
          },
        },
        metrics: {
          select: {
            variantId: true,
            value: true,
            timestamp: true,
          },
        },
      },
    })) as ABTestWithRelations;

    if (!test) {
      throw new Error("Test not found");
    }

    const segmentMetrics: SegmentMetrics = {};

    // Initialize segment metrics structure
    for (const [segmentName, segmentValues] of Object.entries(segments)) {
      segmentMetrics[segmentName] = {};
      for (const value of segmentValues) {
        segmentMetrics[segmentName][value] = {
          conversion_rate: 0,
          sample_size: 0,
        };
      }
    }

    // Calculate metrics for each segment
    for (const [segmentName, segmentValues] of Object.entries(segments)) {
      for (const value of segmentValues) {
        // Filter assignments and conversions by segment
        const segmentAssignments = test.assignments.filter(
          (a) => this.getSegmentValue(a.sessionId, segmentName) === value
        );
        const segmentConversions = test.metrics.filter(
          (c) => this.getSegmentValue(c.sessionId, segmentName) === value
        );

        segmentMetrics[segmentName][value] = {
          conversion_rate:
            segmentAssignments.length > 0
              ? segmentConversions.length / segmentAssignments.length
              : 0,
          sample_size: segmentAssignments.length,
        };
      }
    }

    return segmentMetrics;
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const probability =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  private getGranularityMilliseconds(granularity: string): number {
    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;

    switch (granularity) {
      case "hourly":
        return HOUR;
      case "weekly":
        return WEEK;
      case "daily":
      default:
        return DAY;
    }
  }

  private getSegmentValue(sessionId: string, segmentName: string): string {
    // This is a placeholder implementation
    // In a real application, you would look up the segment value
    // from your user/session data store
    return "default";
  }
}
