import { Injectable, signal, computed, inject } from '@angular/core';
import { EnrichedQuestion } from '../models/progress.model';
import { QuestionFilters, DEFAULT_FILTERS, SortOption } from '../models/filter.model';
import { QuestionService } from './question.service';
import { ProgressService } from './progress.service';
import { isRevisionFlagged } from './revision.service';

import { calculateConfidence } from '../utils/confidence.utils';

export const PAGE_SIZE = 20;

/**
 * Pure filter function — unit-testable.
 */
export function applyFilters(list: EnrichedQuestion[], filters: QuestionFilters): EnrichedQuestion[] {
  return list.filter(q => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const hay = `${q.title} ${q.topic} ${q.pattern} ${q.platform}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (filters.topic !== 'All' && q.topic !== filters.topic) return false;
    if (filters.difficulty !== 'All' && q.stars !== Number(filters.difficulty)) return false;
    if (filters.status !== 'All' && q.status !== filters.status) return false;
    if (filters.pattern !== 'All' && q.pattern !== filters.pattern) return false;
    if (filters.platform !== 'All' && q.platform !== filters.platform) return false;
    if (filters.favorite === 'Favorites' && !q.favorite) return false;
    if (filters.confidence !== 'All') {
      const [lo, hi] = filters.confidence.split('-').map(Number);
      if (q.confidence < lo || q.confidence > hi) return false;
    }
    return true;
  });
}

/**
 * Pure sort function — unit-testable.
 */
export function applySort(list: EnrichedQuestion[], sort: SortOption): EnrichedQuestion[] {
  const arr = [...list];
  switch (sort) {
    case 'difficulty': arr.sort((a, b) => a.stars - b.stars); break;
    case 'recent':     arr.sort((a, b) => (b.lastSolved ?? '').localeCompare(a.lastSolved ?? '')); break;
    case 'confidence': arr.sort((a, b) => b.confidence - a.confidence); break;
    case 'attempts':   arr.sort((a, b) => b.attempts - a.attempts); break;
    case 'topic':      arr.sort((a, b) => a.topic.localeCompare(b.topic)); break;
    case 'alpha':      arr.sort((a, b) => a.title.localeCompare(b.title)); break;
  }
  return arr;
}

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly questionService = inject(QuestionService);
  private readonly progressService = inject(ProgressService);

  readonly filters = signal<QuestionFilters>({ ...DEFAULT_FILTERS });
  readonly currentPage = signal(1);

  /** All questions enriched with their progress data */
  readonly enrichedQuestions = computed<EnrichedQuestion[]>(() => {
    const progress = this.progressService.progress();
    return this.questionService.questions().map(q => {
      const p = progress[q.id];
      let confidence = p?.confidence ?? 0;
      const attempts = p?.attempts ?? 0;
      const timeTaken = p?.timeTaken ?? 0;

      if ((confidence === 0 || confidence === undefined) && (attempts > 0 || timeTaken > 0)) {
        confidence = calculateConfidence(attempts, timeTaken, q.stars);
      }

      return {
        ...q,
        status: p?.status ?? 'Not Started',
        confidence,
        attempts,
        timeTaken,
        lastSolved: p?.lastSolved ?? null,
        revision: p?.revision ?? false,
        favorite: p?.favorite ?? false
      };
    });
  });

  /** Filtered + sorted questions */
  readonly filteredQuestions = computed<EnrichedQuestion[]>(() => {
    const filtered = applyFilters(this.enrichedQuestions(), this.filters());
    return applySort(filtered, this.filters().sort);
  });

  readonly totalFiltered = computed(() => this.filteredQuestions().length);
  readonly totalPages = computed(() => Math.ceil(this.totalFiltered() / PAGE_SIZE));

  /** Current page slice */
  readonly paginatedQuestions = computed<EnrichedQuestion[]>(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredQuestions().slice(start, start + PAGE_SIZE);
  });

  updateFilter<K extends keyof QuestionFilters>(key: K, value: QuestionFilters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }

  // Quick-filter helpers
  readonly solvedCount = computed(() =>
    this.enrichedQuestions().filter(q => q.status === 'Solved' || q.status === 'Mastered').length
  );

  readonly revisionCount = computed(() =>
    this.enrichedQuestions().filter(q => isRevisionFlagged(q)).length
  );

  readonly favoriteQuestions = computed(() =>
    this.enrichedQuestions().filter(q => q.favorite)
  );

  /** Topic-level statistics for progress bars */
  readonly topicStats = computed(() => {
    const questions = this.enrichedQuestions();
    const topics = [...new Set(questions.map(q => q.topic))].sort();
    return topics.map(topic => {
      const qs = questions.filter(q => q.topic === topic);
      const solved = qs.filter(q => q.status === 'Solved' || q.status === 'Mastered').length;
      const completion = qs.length ? Math.round((solved / qs.length) * 100) : 0;
      const avgConf = qs.length
        ? Math.round(qs.reduce((s, q) => s + q.confidence, 0) / qs.length)
        : 0;
      return { topic, total: qs.length, solved, completion, avgConf };
    });
  });

  /** Difficulty breakdown stats */
  readonly difficultyStats = computed(() => {
    const questions = this.enrichedQuestions();
    return [1, 2, 3, 4, 5].map(stars => {
      const qs = questions.filter(q => q.stars === stars);
      const solved = qs.filter(q => q.status === 'Solved' || q.status === 'Mastered').length;
      return { stars, total: qs.length, solved };
    });
  });
}
