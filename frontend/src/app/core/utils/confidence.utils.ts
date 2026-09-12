/**
 * Star configuration for baseline solve time benchmarks and penalties:
 * - 1 Star (Easy): Target baseline = 5 min, Extra time penalty = 1.0 pt/min, Attempt penalty = 18 pts/extra attempt.
 * - 2 Stars (Easy-Med): Target baseline = 8 min, Extra time penalty = 0.8 pt/min, Attempt penalty = 16 pts/extra attempt.
 * - 3 Stars (Medium): Target baseline = 12 min, Extra time penalty = 0.6 pt/min, Attempt penalty = 14 pts/extra attempt.
 * - 4 Stars (Hard-Med): Target baseline = 16 min, Extra time penalty = 0.4 pt/min, Attempt penalty = 12 pts/extra attempt.
 * - 5 Stars (Hard): Target baseline = 20 min, Extra time penalty = 0.3 pt/min, Attempt penalty = 10 pts/extra attempt.
 */
interface StarBenchmark {
  targetTime: number;
  timeCoeff: number;
  attemptCoeff: number;
}

const STAR_BENCHMARKS: Record<number, StarBenchmark> = {
  1: { targetTime: 5, timeCoeff: 1.0, attemptCoeff: 18 },
  2: { targetTime: 8, timeCoeff: 0.8, attemptCoeff: 16 },
  3: { targetTime: 12, timeCoeff: 0.6, attemptCoeff: 14 },
  4: { targetTime: 16, timeCoeff: 0.4, attemptCoeff: 12 },
  5: { targetTime: 20, timeCoeff: 0.3, attemptCoeff: 10 }
};

/**
 * Automatically calculate difficulty-aware confidence score (0 - 100).
 *
 * Solve attempts of 1 within target benchmark time yield 100% confidence score.
 */
export function calculateConfidence(attempts: number, timeTaken: number, stars: number = 3): number {
  const att = Math.max(0, Number(attempts) || 0);
  const time = Math.max(0, Number(timeTaken) || 0);

  if (att === 0 && time === 0) return 0;

  const s = Math.max(1, Math.min(5, Math.round(Number(stars) || 3)));
  const a = Math.max(1, att);
  const benchmark = STAR_BENCHMARKS[s] || STAR_BENCHMARKS[3];

  const attemptPenalty = (a - 1) * benchmark.attemptCoeff;
  const extraTime = Math.max(0, time - benchmark.targetTime);
  const timePenalty = Math.min(50, extraTime * benchmark.timeCoeff);

  const rawScore = 100 - attemptPenalty - timePenalty;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Descriptor helper: High (>= 80%), Medium (>= 60%), Low (>= 40%), Very Low (< 40%).
 */
export function getConfidenceDescriptor(score: number): string {
  const s = Number(score) || 0;
  if (s >= 80) return 'High';
  if (s >= 60) return 'Medium';
  if (s >= 40) return 'Low';
  return 'Very Low';
}
