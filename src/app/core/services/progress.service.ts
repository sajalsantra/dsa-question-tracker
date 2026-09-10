import { Injectable, signal, computed, inject } from '@angular/core';
import { QuestionProgress, QuestionStatus } from '../models/progress.model';
import { ProgressRepository } from '../repositories/progress.repository';
import { LocalProgressRepository } from '../repositories/local/local-progress.repository';

/** Returns today's date as YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build a default progress record for a question */
export function defaultProgress(questionId: number): QuestionProgress {
  return {
    questionId,
    status: 'Not Started',
    confidence: 0,
    attempts: 0,
    timeTaken: 0,
    lastSolved: null,
    revision: false,
    favorite: false,
    updatedAt: new Date().toISOString()
  };
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly repo: ProgressRepository = inject(LocalProgressRepository);

  private readonly _progress = signal<Record<number, QuestionProgress>>({});
  readonly progress = this._progress.asReadonly();

  // Computed statistics
  readonly solvedCount = computed(() =>
    Object.values(this._progress()).filter(
      p => p.status === 'Solved' || p.status === 'Mastered'
    ).length
  );

  readonly masteredCount = computed(() =>
    Object.values(this._progress()).filter(p => p.status === 'Mastered').length
  );

  readonly favoriteCount = computed(() =>
    Object.values(this._progress()).filter(p => p.favorite).length
  );

  readonly totalAttempts = computed(() =>
    Object.values(this._progress()).reduce((sum, p) => sum + p.attempts, 0)
  );

  /** Load all progress from storage into the signal */
  load(): void {
    this.repo.getAll().subscribe(all => this._progress.set(all));
  }

  /** Get progress for a single question (or default) */
  getProgress(questionId: number): QuestionProgress {
    return this._progress()[questionId] ?? defaultProgress(questionId);
  }

  /** Update a question's progress with a partial patch */
  updateProgress(questionId: number, patch: Partial<QuestionProgress>): void {
    const current = this.getProgress(questionId);
    const updated: QuestionProgress = {
      ...current,
      ...patch,
      questionId,
      updatedAt: new Date().toISOString()
    };
    this._progress.update(all => ({ ...all, [questionId]: updated }));
    this.repo.save(questionId, updated).subscribe();
  }

  /** Mark a question with a specific status */
  setStatus(questionId: number, status: QuestionStatus): void {
    const patch: Partial<QuestionProgress> = { status };
    if (status === 'Solved' || status === 'Mastered') {
      patch.lastSolved = todayStr();
    }
    this.updateProgress(questionId, patch);
  }

  /** Toggle favorite */
  toggleFavorite(questionId: number): void {
    const current = this.getProgress(questionId);
    this.updateProgress(questionId, { favorite: !current.favorite });
  }

  /** Toggle revision flag */
  toggleRevision(questionId: number): void {
    const current = this.getProgress(questionId);
    this.updateProgress(questionId, { revision: !current.revision });
  }

  /** Reset individual question progress */
  resetQuestion(questionId: number): void {
    this.updateProgress(questionId, defaultProgress(questionId));
  }

  /** Reset all progress */
  resetAll(questionIds: number[]): void {
    this.repo.reset().subscribe(() => {
      const fresh: Record<number, QuestionProgress> = {};
      for (const id of questionIds) {
        fresh[id] = defaultProgress(id);
      }
      this._progress.set(fresh);
    });
  }
}
