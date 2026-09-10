import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly http = inject(HttpClient);

  private readonly _questions = signal<Question[]>([]);
  readonly questions = this._questions.asReadonly();

  // Derived metadata computed once from the dataset
  private _topics: string[] = [];
  private _patterns: string[] = [];
  private _platforms: string[] = [];

  get topics(): string[] { return this._topics; }
  get patterns(): string[] { return this._patterns; }
  get platforms(): string[] { return this._platforms; }

  /**
   * Loads questions from the local JSON asset.
   * Future: replace URL with `${environment.apiUrl}/questions`
   */
  loadQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>('assets/data/questions.json').pipe(
      tap(questions => {
        console.log(`Loaded ${questions?.length} questions successfully`);
        this._questions.set(questions || []);
        this._topics = [...new Set((questions || []).map(q => q.topic))].sort();
        this._patterns = [...new Set((questions || []).map(q => q.pattern))].sort();
        this._platforms = [...new Set((questions || []).map(q => q.platform))].sort();
      })
    );
  }

  getById(id: number): Question | undefined {
    return this._questions().find(q => q.id === id);
  }
}
