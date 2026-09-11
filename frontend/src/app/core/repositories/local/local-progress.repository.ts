import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { QuestionProgress } from '../../models/progress.model';
import { ProgressRepository } from '../progress.repository';

const KEY = 'dsaProgress';

@Injectable({ providedIn: 'root' })
export class LocalProgressRepository extends ProgressRepository {

  getAll(): Observable<Record<number, QuestionProgress>> {
    return of(this.load());
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    const all = this.load();
    all[questionId] = progress;
    this.persist(all);
    return of(void 0);
  }

  delete(questionId: number): Observable<void> {
    const all = this.load();
    delete all[questionId];
    this.persist(all);
    return of(void 0);
  }

  reset(): Observable<void> {
    localStorage.removeItem(KEY);
    return of(void 0);
  }

  private load(): Record<number, QuestionProgress> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persist(data: Record<number, QuestionProgress>): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist progress:', e);
    }
  }
}
