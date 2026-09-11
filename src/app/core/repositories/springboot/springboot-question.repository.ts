import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Question } from '../../models/question.model';

@Injectable({ providedIn: 'root' })
export class SpringBootQuestionRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/questions';

  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.baseUrl).pipe(
      catchError(err => {
        console.warn('SpringBoot Question fetch failed:', err);
        return of([]);
      })
    );
  }
}
