import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { NotesRepository } from '../notes.repository';
import { StorageService } from '../../services/storage.service';

@Injectable({ providedIn: 'root' })
export class LocalNotesRepository extends NotesRepository {
  private readonly storage = inject(StorageService);

  getAll(): Observable<Record<number, string>> {
    return of(this.load());
  }

  save(questionId: number, notes: string): Observable<void> {
    const all = this.load();
    all[questionId] = notes;
    this.storage.setData('notes', all);
    return of(void 0);
  }

  delete(questionId: number): Observable<void> {
    const all = this.load();
    delete all[questionId];
    this.storage.setData('notes', all);
    return of(void 0);
  }

  reset(): Observable<void> {
    this.storage.removeData('notes');
    return of(void 0);
  }

  private load(): Record<number, string> {
    return this.storage.getData<Record<number, string>>('notes') || {};
  }
}
