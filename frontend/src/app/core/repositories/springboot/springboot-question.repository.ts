import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Question } from '../../models/question.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpringBootQuestionRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/questions`;

  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.baseUrl).pipe(
      catchError(err => {
        console.warn('SpringBoot Question fetch failed:', err);
        return of([]);
      })
    );
  }
}
