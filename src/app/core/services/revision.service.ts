import { Injectable, computed, inject } from '@angular/core';
import { EnrichedQuestion } from '../models/progress.model';
import { QuestionService } from './question.service';
import { ProgressService } from './progress.service';

export interface RevisionEntry {
  question: EnrichedQuestion;
  reason: string;
}

/**
 * Pure function — fully unit-testable.
 * Determines if a question should be in the revision queue.
 * Matches original js/filters.js isRevisionFlagged() logic exactly.
 */
export function isRevisionFlagged(q: EnrichedQuestion): boolean {
  if (q.status === 'Mastered') return false;
  if (q.status === 'Needs Revision' || q.revision === true) return true;

  if (q.status === 'Solved' || q.status === 'In Progress') {
    const daysSince = q.lastSolved
      ? Math.floor((Date.now() - new Date(q.lastSolved).getTime()) / 86_400_000)
      : 999;

    const stars = Math.max(1, Math.min(5, q.stars));

    if (q.confidence < 60) return true;

    const maxAttempts = stars <= 2 ? 2 : stars >= 4 ? 4 : 3;
    if (q.attempts >= maxAttempts) return true;

    const maxTime = stars <= 2 ? 30 : stars >= 4 ? 75 : 45;
    if (q.timeTaken >= maxTime) return true;

    if (daysSince > 14 && q.confidence < 80) return true;
    if (daysSince > 30) return true;
  }

  return false;
}

/** Get a human-readable reason for why a question is flagged */
export function revisionReason(q: EnrichedQuestion): string {
  if (q.status === 'Needs Revision' || q.revision) return 'Manually flagged';

  const daysSince = q.lastSolved
    ? Math.floor((Date.now() - new Date(q.lastSolved).getTime()) / 86_400_000)
    : 999;

  if (q.confidence < 60) return `Low confidence (${q.confidence}%)`;
  if (daysSince > 30) return `${daysSince} days since last solved`;
  if (daysSince > 14 && q.confidence < 80) return `${daysSince} days ago, confidence ${q.confidence}%`;

  const stars = Math.max(1, Math.min(5, q.stars));
  const maxAttempts = stars <= 2 ? 2 : stars >= 4 ? 4 : 3;
  if (q.attempts >= maxAttempts) return `High attempts (${q.attempts})`;

  const maxTime = stars <= 2 ? 30 : stars >= 4 ? 75 : 45;
  if (q.timeTaken >= maxTime) return `Long time taken (${q.timeTaken} min)`;

  return 'Needs review';
}

@Injectable({ providedIn: 'root' })
export class RevisionService {
  private readonly questionService = inject(QuestionService);
  private readonly progressService = inject(ProgressService);

  readonly revisionQueue = computed<RevisionEntry[]>(() => {
    const progress = this.progressService.progress();
    return this.questionService.questions()
      .map(q => {
        const p = progress[q.id];
        const enriched: EnrichedQuestion = {
          ...q,
          status: p?.status ?? 'Not Started',
          confidence: p?.confidence ?? 0,
          attempts: p?.attempts ?? 0,
          timeTaken: p?.timeTaken ?? 0,
          lastSolved: p?.lastSolved ?? null,
          revision: p?.revision ?? false,
          favorite: p?.favorite ?? false
        };
        return { question: enriched, reason: revisionReason(enriched) };
      })
      .filter(entry => isRevisionFlagged(entry.question));
  });
}
