import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NotesRepository } from '../notes.repository';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpringBootNotesRepository extends NotesRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notes`;

  getAll(): Observable<Record<number, string>> {
    return this.http.get<Record<number, string>>(this.baseUrl).pipe(
      catchError(err => {
        console.warn('Failed to fetch notes from MySQL:', err);
        return of({});
      })
    );
  }

  save(questionId: number, notes: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${questionId}`, { notes }).pipe(
      catchError(err => {
        console.warn(`Failed to save note for question ${questionId} to MySQL:`, err);
        return of(undefined);
      })
    );
  }

  sync(notesMap: Record<number, string>): Observable<Record<number, string>> {
    return this.http.post<Record<number, string>>(`${this.baseUrl}/sync`, notesMap).pipe(
      catchError(err => {
        console.warn('Failed to sync notes batch to MySQL:', err);
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
