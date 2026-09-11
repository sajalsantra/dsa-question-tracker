import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { NotesRepository } from '../notes.repository';

const KEY = 'dsaNotes';

@Injectable({ providedIn: 'root' })
export class LocalNotesRepository extends NotesRepository {

  getAll(): Observable<Record<number, string>> {
    return of(this.load());
  }

  save(questionId: number, notes: string): Observable<void> {
    const all = this.load();
    all[questionId] = notes;
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

  private load(): Record<number, string> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persist(data: Record<number, string>): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist notes:', e);
    }
  }
}
