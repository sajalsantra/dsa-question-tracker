import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { ProgressRepository } from '../progress.repository';
import { QuestionProgress } from '../../models/progress.model';
import { LocalProgressRepository } from '../local/local-progress.repository';
import { FirebaseProgressRepository } from '../firebase/firebase-progress.repository';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class HybridProgressRepository implements ProgressRepository {
  private readonly localRepo = inject(LocalProgressRepository);
  private readonly fbRepo = inject(FirebaseProgressRepository);
  private readonly fb = inject(FirebaseService);

  getAll(): Observable<Record<number, QuestionProgress>> {
    const local$ = this.localRepo.getAll();

    if (this.fb.auth.currentUser) {
      return local$.pipe(
        switchMap(localData =>
          this.fbRepo.getAll().pipe(
            map(remoteData => {
              if (remoteData && Object.keys(remoteData).length > 0) {
                for (const [idStr, progress] of Object.entries(remoteData)) {
                  this.localRepo.save(Number(idStr), progress).subscribe();
                }
                return remoteData;
              }
              return localData;
            }),
            catchError(() => of(localData)),
            startWith(localData)
          )
        )
      );
    }

    return local$;
  }

  syncLocalToRemote(): Observable<void> {
    if (!this.fb.auth.currentUser) return of(undefined);

    return this.localRepo.getAll().pipe(
      tap(localData => {
        if (localData && Object.keys(localData).length > 0) {
          for (const [idStr, progress] of Object.entries(localData)) {
            this.fbRepo.save(Number(idStr), progress).subscribe();
          }
        }
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    const updatedProgress: QuestionProgress = {
      ...progress,
      updatedAt: progress.updatedAt || new Date().toISOString()
    };

    // 1. Save locally instantly (0ms response)
    this.localRepo.save(questionId, updatedProgress).subscribe();

    // 2. Sync to Firebase Firestore if logged in
    if (this.fb.auth.currentUser) {
      return this.fbRepo.save(questionId, updatedProgress);
    }
    return of(undefined);
  }

  delete(questionId: number): Observable<void> {
    this.localRepo.delete(questionId).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.delete(questionId);
    }
    return of(undefined);
  }

  reset(): Observable<void> {
    this.localRepo.reset().subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.reset();
    }
    return of(undefined);
  }
}
