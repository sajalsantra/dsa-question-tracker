import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, catchError, of } from 'rxjs';
import { Question } from '../models/question.model';
import { ApiHealthService } from './api-health.service';
import { SpringBootQuestionRepository } from '../repositories/springboot/springboot-question.repository';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);
  private readonly healthService = inject(ApiHealthService);
  private readonly springBootRepo = inject(SpringBootQuestionRepository);

  private readonly _questions = signal<Question[]>([]);
  readonly questions = this._questions.asReadonly();

  // Derived metadata computed once from the dataset
  private _topics: string[] = [];
  private _patterns: string[] = [];
  private _platforms: string[] = [];

  get topics(): string[] { return this._topics; }
  get patterns(): string[] { return this._patterns; }
  get platforms(): string[] { return this._platforms; }

  loadQuestions(): Observable<Question[]> {
    const jsonFallback$ = this.http.get<Question[]>('assets/data/questions.json').pipe(
      catchError(err => {
        console.warn('Failed to load local questions.json:', err);
        return of([]);
      })
    );

    let stream$: Observable<Question[]>;

    if (this.healthService.isSpringBootOnline()) {
      stream$ = this.springBootRepo.getAll().pipe(
        switchMap(list => (list && list.length > 0) ? of(list) : jsonFallback$),
        catchError(() => jsonFallback$)
      );
    } else {
      stream$ = jsonFallback$;
    }

    return stream$.pipe(
      tap(questions => {
        console.log(`Loaded ${questions?.length} questions successfully`);
        this._questions.set(questions || []);
        this._topics = [...new Set((questions || []).map(q => q.topic))].sort();
        this._patterns = [...new Set((questions || []).map(q => q.pattern).filter(Boolean))].sort();
        this._platforms = [...new Set((questions || []).map(q => q.platform).filter(Boolean))].sort();
      })
    );
  }

  getById(id: number): Question | undefined {
    return this._questions().find(q => q.id === id);
  }
}
