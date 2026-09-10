import { computeReadiness } from './readiness.service';
import { EnrichedQuestion } from '../models/progress.model';

describe('computeReadiness Algorithm', () => {
  it('should return 0 score and Beginner tag for empty question list', () => {
    const res = computeReadiness([]);
    expect(res.score).toBe(0);
    expect(res.tag).toBe('Beginner');
  });

  it('should compute higher score when questions are solved with high confidence', () => {
    const mockQuestions: EnrichedQuestion[] = [
      { id: 1, title: 'Q1', topic: 'Arrays', pattern: 'P1', platform: 'LeetCode', stars: 1, problemUrl: '', status: 'Solved', confidence: 90, attempts: 1, timeTaken: 15, lastSolved: '2026-09-10', revision: false, favorite: false },
      { id: 2, title: 'Q2', topic: 'Strings', pattern: 'P1', platform: 'LeetCode', stars: 4, problemUrl: '', status: 'Solved', confidence: 95, attempts: 1, timeTaken: 30, lastSolved: '2026-09-10', revision: false, favorite: false },
    ];
    const res = computeReadiness(mockQuestions);
    expect(res.score).toBeGreaterThan(50);
  });
});
