import { applyFilters, applySort } from './filter.service';
import { EnrichedQuestion } from '../models/progress.model';
import { DEFAULT_FILTERS } from '../models/filter.model';

describe('Filter & Sort Functions', () => {
  const sampleList: EnrichedQuestion[] = [
    { id: 1, title: 'Two Sum', topic: 'Arrays', pattern: 'Hash Map', platform: 'LeetCode', stars: 1, problemUrl: '', status: 'Solved', confidence: 90, attempts: 1, timeTaken: 10, lastSolved: '2026-09-10', revision: false, favorite: true },
    { id: 2, title: '3Sum', topic: 'Arrays', pattern: 'Two Pointers', platform: 'LeetCode', stars: 3, problemUrl: '', status: 'Not Started', confidence: 0, attempts: 0, timeTaken: 0, lastSolved: null, revision: false, favorite: false },
    { id: 3, title: 'Binary Tree Level Order', topic: 'Trees', pattern: 'BFS', platform: 'LeetCode', stars: 2, problemUrl: '', status: 'In Progress', confidence: 50, attempts: 2, timeTaken: 25, lastSolved: null, revision: false, favorite: false },
  ];

  it('should filter by search keyword', () => {
    const res = applyFilters(sampleList, { ...DEFAULT_FILTERS, search: 'Two Sum' });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe(1);
  });

  it('should filter by topic', () => {
    const res = applyFilters(sampleList, { ...DEFAULT_FILTERS, topic: 'Trees' });
    expect(res.length).toBe(1);
    expect(res[0].title).toBe('Binary Tree Level Order');
  });

  it('should sort by difficulty ascending', () => {
    const sorted = applySort(sampleList, 'difficulty');
    expect(sorted[0].stars).toBe(1);
    expect(sorted[1].stars).toBe(2);
    expect(sorted[2].stars).toBe(3);
  });
});
