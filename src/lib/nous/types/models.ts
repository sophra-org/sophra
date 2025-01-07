export enum ModelType {
  SEARCH_RANKER = 'search_ranker',
  PATTERN_DETECTOR = 'pattern_detector',
  QUERY_OPTIMIZER = 'query_optimizer',
  FEEDBACK_ANALYZER = 'feedback_analyzer',
  OPENAI_FINE_TUNED = 'openai_fine_tuned'
}

export interface ModelConfig {
  type: ModelType;
  hyperparameters: Record<string, unknown>;
  features: string[];
  trainingParams: Record<string, unknown>;
}

export interface ModelVersion {
  id: string;
  createdAt: Date;
  config: ModelConfig;
  metrics: Record<string, number>;
  artifactPath: string;
  parentVersion?: string;
}

export interface TrainingMetrics {
  loss: number;
  accuracy: number;
  validationMetrics: Record<string, number>;
  trainingDuration: number;
  iterationCount: number;
}

export interface ModelEvaluation {
  versionId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  testCases: Array<Record<string, unknown>>;
  performanceComparison?: Record<string, number>;
}
