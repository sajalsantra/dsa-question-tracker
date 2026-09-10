import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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

    // If authenticated, perform timestamp-based 2-way smart sync between local & Firestore
    if (this.fb.auth.currentUser) {
      local$.pipe(
        tap(localData => {
          this.fbRepo.getAll().pipe(
            tap(remoteData => this.syncProgressWithTimestamp(localData || {}, remoteData || {})),
            catchError(() => of({}))
          ).subscribe();
        })
      ).subscribe();
    }

    return local$;
  }

  private syncProgressWithTimestamp(
    localData: Record<number, QuestionProgress>,
    remoteData: Record<number, QuestionProgress>
  ): void {
    const allIds = new Set([
      ...Object.keys(localData).map(Number),
      ...Object.keys(remoteData).map(Number)
    ]);

    for (const id of allIds) {
      const local = localData[id];
      const remote = remoteData[id];

      if (local && remote) {
        const localTime = new Date(local.updatedAt || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || 0).getTime();

        if (localTime > remoteTime) {
          // Local update is newer -> sync to Cloud Firestore
          this.fbRepo.save(id, local).subscribe();
        } else if (remoteTime > localTime) {
          // Remote update is newer -> sync to LocalStorage
          this.localRepo.save(id, remote).subscribe();
        }
      } else if (local && !remote) {
        // Local exists but remote does not -> sync to Cloud Firestore
        this.fbRepo.save(id, local).subscribe();
      } else if (remote && !local) {
        // Remote exists but local does not -> sync to LocalStorage
        this.localRepo.save(id, remote).subscribe();
      }
    }
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
