import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { QuestionProgress } from '../../models/progress.model';
import { ProgressRepository } from '../progress.repository';
import { StorageService } from '../../services/storage.service';

@Injectable({ providedIn: 'root' })
export class LocalProgressRepository extends ProgressRepository {
  private readonly storage = inject(StorageService);

  getAll(): Observable<Record<number, QuestionProgress>> {
    return of(this.load());
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    const all = this.load();
    all[questionId] = progress;
    this.storage.setData('progress', all);
    return of(void 0);
  }

  delete(questionId: number): Observable<void> {
    const all = this.load();
    delete all[questionId];
    this.storage.setData('progress', all);
    return of(void 0);
  }

  reset(): Observable<void> {
    this.storage.removeData('progress');
    return of(void 0);
  }

  private load(): Record<number, QuestionProgress> {
    return this.storage.getData<Record<number, QuestionProgress>>('progress') || {};
  }
}
