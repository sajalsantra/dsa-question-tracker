import { Observable } from 'rxjs';

export abstract class NotesRepository {
  abstract getAll(): Observable<Record<number, string>>;
  abstract save(questionId: number, notes: string): Observable<void>;
  abstract delete(questionId: number): Observable<void>;
  abstract reset(): Observable<void>;
  syncLocalToRemote?(): Observable<void>;
}
