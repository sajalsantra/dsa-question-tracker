import { Injectable, computed, inject } from '@angular/core';
import { EnrichedQuestion } from '../models/progress.model';
import { QuestionService } from './question.service';
import { ProgressService } from './progress.service';

export interface ReadinessResult {
  score: number;         // 0-100
  tag: string;           // 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced' | 'Expert'
  weakTopics: string[];
  recommendedNext: EnrichedQuestion[];
}

/**
 * Pure function — fully unit-testable.
 * Computes interview readiness score from enriched question data.
 */
export function computeReadiness(enriched: EnrichedQuestion[]): ReadinessResult {
  if (!enriched.length) {
    return { score: 0, tag: 'Beginner', weakTopics: [], recommendedNext: [] };
  }

  const total = enriched.length;
  const solved = enriched.filter(q => q.status === 'Solved' || q.status === 'Mastered');
  const mastered = enriched.filter(q => q.status === 'Mastered');

  // Completion rate (40% weight)
  const completionPct = (solved.length / total) * 100;

  // Average confidence of solved questions (20% weight)
  const avgConf = solved.length
    ? solved.reduce((s, q) => s + q.confidence, 0) / solved.length
    : 0;

  // Hard coverage: solved questions with stars >= 4 (20% weight)
  const hardTotal = enriched.filter(q => q.stars >= 4).length;
  const hardSolved = solved.filter(q => q.stars >= 4).length;
  const hardCoverage = hardTotal ? (hardSolved / hardTotal) * 100 : 0;

  // Topic diversity: % of topics with at least one solved (20% weight)
  const topics = [...new Set(enriched.map(q => q.topic))];
  const solvedTopics = new Set(solved.map(q => q.topic));
  const topicCoverage = topics.length ? (solvedTopics.size / topics.length) * 100 : 0;

  // Mastery bonus (up to 10 extra points)
  const masteryBonus = Math.min(10, (mastered.length / total) * 100);

  const raw = completionPct * 0.40
    + avgConf * 0.20
    + hardCoverage * 0.20
    + topicCoverage * 0.20
    + masteryBonus;

  const score = Math.round(Math.min(100, raw));

  const tag =
    score >= 90 ? 'Expert'
    : score >= 75 ? 'Advanced'
    : score >= 50 ? 'Intermediate'
    : score >= 25 ? 'Elementary'
    : 'Beginner';

  // Weak topics: < 30% solved
  const weakTopics = topics.filter(topic => {
    const topicQs = enriched.filter(q => q.topic === topic);
    const topicSolved = topicQs.filter(q => q.status === 'Solved' || q.status === 'Mastered');
    return (topicSolved.length / topicQs.length) < 0.3;
  }).slice(0, 5);

  // Recommended next: unsolved easy/medium questions from weak topics
  const recommendedNext = enriched
    .filter(q =>
      q.status === 'Not Started'
      && weakTopics.includes(q.topic)
      && q.stars <= 3
    )
    .slice(0, 8);

  return { score, tag, weakTopics, recommendedNext };
}

@Injectable({ providedIn: 'root' })
export class ReadinessService {
  private readonly questionService = inject(QuestionService);
  private readonly progressService = inject(ProgressService);

  readonly readiness = computed<ReadinessResult>(() => {
    const progress = this.progressService.progress();
    const enriched: EnrichedQuestion[] = this.questionService.questions().map(q => {
      const p = progress[q.id];
      return {
        ...q,
        status: p?.status ?? 'Not Started',
        confidence: p?.confidence ?? 0,
        attempts: p?.attempts ?? 0,
        timeTaken: p?.timeTaken ?? 0,
        lastSolved: p?.lastSolved ?? null,
        revision: p?.revision ?? false,
        favorite: p?.favorite ?? false
      };
    });
    return computeReadiness(enriched);
  });
}
