export function calculateConfidence(feedback: any[]): number {
  if (!feedback || feedback.length === 0) return 0;

  const sampleSize = feedback.length;
  const baseConfidence = Math.min(sampleSize / 100, 1); // Scale with sample size up to 100
  const consistencyScore = calculateConsistencyScore(feedback);
  return Math.round(baseConfidence * consistencyScore * 100) / 100;
}

export function calculateConsistencyScore(feedback: any[]): number {
  if (!feedback || feedback.length < 2) return 0.5;

  const ratings = feedback.map((f) => f.rating);
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance =
    ratings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratings.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation means more consistent ratings
  return Math.max(0, 1 - standardDeviation);
}

export function calculateAverageRating(feedback: any[]): number {
  if (!feedback || feedback.length === 0) return 0;
  return (
    Math.round(
      (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length) * 100
    ) / 100
  );
}
