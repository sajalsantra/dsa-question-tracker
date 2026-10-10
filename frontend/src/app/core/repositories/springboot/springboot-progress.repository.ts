import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProgressRepository } from '../progress.repository';
import { QuestionProgress } from '../../models/progress.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpringBootProgressRepository extends ProgressRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/progress`;

  getAll(): Observable<Record<number, QuestionProgress>> {
    return this.http.get<Record<number, QuestionProgress>>(this.baseUrl).pipe(
      catchError(err => {
        console.warn('Failed to fetch progress from MySQL:', err);
        return of({});
      })
    );
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${questionId}`, progress).pipe(
      catchError(err => {
        console.warn(`Failed to save progress for question ${questionId} to MySQL:`, err);
        return of(undefined);
      })
    );
  }

  sync(progressMap: Record<number, QuestionProgress>): Observable<Record<number, QuestionProgress>> {
    return this.http.post<Record<number, QuestionProgress>>(`${this.baseUrl}/sync`, progressMap).pipe(
      catchError(err => {
        console.warn('Failed to sync progress batch to MySQL:', err);
        return of({});
      })
    );
  }

  delete(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${questionId}`).pipe(
      catchError(() => of(undefined))
    );
  }

  reset(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reset`).pipe(
      catchError(() => of(undefined))
    );
  }
}
