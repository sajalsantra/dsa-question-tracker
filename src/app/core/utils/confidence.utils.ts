/**
 * Automatically calculate difficulty-aware confidence score (0 - 100).
 *
 * Difficulty factors (based on stars 1 to 5):
 * - Stars 1-2 (Easy): Attempt penalty = 18 pts/extra attempt. Time penalty = 0.7 pts/min.
 * - Star 3 (Medium): Attempt penalty = 14 pts/extra attempt. Time penalty = 0.5 pts/min.
 * - Stars 4-5 (Hard): Attempt penalty = 10 pts/extra attempt. Time penalty = 0.3 pts/min.
 */
export function calculateConfidence(attempts: number, timeTaken: number, stars: number = 3): number {
  const att = Math.max(0, Number(attempts) || 0);
  const time = Math.max(0, Number(timeTaken) || 0);

  if (att === 0 && time === 0) return 0;

  const s = Math.max(1, Math.min(5, Number(stars) || 3));
  const a = Math.max(1, att);

  let attemptCoeff = 14;
  let timeCoeff = 0.5;

  if (s <= 2) {
    attemptCoeff = 18;
    timeCoeff = 0.7;
  } else if (s >= 4) {
    attemptCoeff = 10;
    timeCoeff = 0.3;
  }

  const attemptPenalty = (a - 1) * attemptCoeff;
  const timePenalty = Math.min(50, time * timeCoeff);

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
