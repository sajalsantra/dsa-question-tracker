import { isRevisionFlagged, revisionReason } from './revision.service';
import { EnrichedQuestion } from '../models/progress.model';

describe('isRevisionFlagged Algorithm', () => {
  const baseQuestion: EnrichedQuestion = {
    id: 1,
    title: 'Test Problem',
    topic: 'Arrays',
    pattern: 'Two Pointers',
    platform: 'LeetCode',
    stars: 3,
    problemUrl: 'https://leetcode.com',
    status: 'Solved',
    confidence: 85,
    attempts: 1,
    timeTaken: 20,
    lastSolved: new Date().toISOString().slice(0, 10),
    revision: false,
    favorite: false
  };

  it('should not flag a freshly solved high-confidence question', () => {
    expect(isRevisionFlagged(baseQuestion)).toBeFalse();
  });

  it('should flag if status is Needs Revision', () => {
    const q = { ...baseQuestion, status: 'Needs Revision' as const };
    expect(isRevisionFlagged(q)).toBeTrue();
  });

  it('should flag if confidence < 60%', () => {
    const q = { ...baseQuestion, confidence: 45 };
    expect(isRevisionFlagged(q)).toBeTrue();
    expect(revisionReason(q)).toContain('Low confidence');
  });

  it('should flag if attempts exceed difficulty threshold', () => {
    const q = { ...baseQuestion, stars: 1, attempts: 3 }; // max 2 attempts for 1-star
    expect(isRevisionFlagged(q)).toBeTrue();
  });

  it('should not flag Mastered questions even if old', () => {
    const q = { ...baseQuestion, status: 'Mastered' as const, confidence: 30 };
    expect(isRevisionFlagged(q)).toBeFalse();
  });
});
