import { ElasticsearchService } from '../../../cortex/elasticsearch/services';
import { Logger } from '../../types';
import { LearningEvent, LearningPattern, PrismaClient } from "@prisma/client";
import { MetricsAdapter } from "../adapters/metrics-adapter";
import { BaseProcessor } from "./base-processor";

interface FeedbackMetadata {
  feedbackType: string;
  score?: number;
  searchId?: string;
  [key: string]: any;
}

export class FeedbackProcessor extends BaseProcessor {
  constructor(
    logger: Logger,
    metrics: MetricsAdapter,
    private elasticsearch: ElasticsearchService,
    private prisma: PrismaClient
  ) {
    super(logger, metrics);
  }

  async analyze(events: LearningEvent[]): Promise<LearningPattern[]> {
    const feedbackEvents = events.filter((e) => e.type === "USER_FEEDBACK");
    const patterns: LearningPattern[] = [];

    for (const event of feedbackEvents) {
      const relatedEvents = await this.findRelatedEvents(event);
      const pattern = await this.extractFeedbackPattern(event, relatedEvents);
      if (pattern) patterns.push(pattern);
    }

    return patterns;
  }

  private async findRelatedEvents(
    event: LearningEvent
  ): Promise<LearningEvent[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const response = await this.elasticsearch.search("learning-events", {
      query: {
        bool: {
          must: [
            {
              term: {
                "id.keyword": event.id,
                _id: "",
              },
            },
          ],
        },
      },
    });

    return response.hits.hits.map(
      (hit) => hit._source as unknown as LearningEvent
    );
  }

  private async extractFeedbackPattern(
    event: LearningEvent,
    relatedEvents: LearningEvent[]
  ): Promise<LearningPattern | null> {
    const metadata = event.metadata as FeedbackMetadata | null;
    if (!metadata?.feedbackType) {
      return null;
    }

    // Extract features from the event metadata
    const features: Record<string, any> = {};
    if (metadata.score !== undefined) {
      features.score = metadata.score;
    }
    if (metadata.searchId) {
      features.searchId = metadata.searchId;
    }

    // Create pattern with extracted features
    return {
      id: `feedback_${event.id}`,
      type: "USER_FEEDBACK_PATTERN",
      confidence: 0.8,
      features,
      metadata: { ...metadata }, // Spread the metadata directly since feedbackType is already included
      eventId: event.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
