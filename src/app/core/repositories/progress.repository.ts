import { Observable } from 'rxjs';
import { QuestionProgress } from '../models/progress.model';

/**
 * Repository interface for question progress persistence.
 * Local: backed by LocalStorage.
 * Future: backed by HTTP -> Spring Boot REST API.
 */
export abstract class ProgressRepository {
  abstract getAll(): Observable<Record<number, QuestionProgress>>;
  abstract save(questionId: number, progress: QuestionProgress): Observable<void>;
  abstract delete(questionId: number): Observable<void>;
  abstract reset(): Observable<void>;
}
