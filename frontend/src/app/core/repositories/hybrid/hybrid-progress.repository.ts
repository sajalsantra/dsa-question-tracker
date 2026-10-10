import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { ProgressRepository } from '../progress.repository';
import { QuestionProgress } from '../../models/progress.model';
import { LocalProgressRepository } from '../local/local-progress.repository';
import { SpringBootProgressRepository } from '../springboot/springboot-progress.repository';
import { StorageService } from '../../services/storage.service';
import { ApiHealthService } from '../../services/api-health.service';

@Injectable({ providedIn: 'root' })
export class HybridProgressRepository implements ProgressRepository {
  private readonly localRepo = inject(LocalProgressRepository);
  private readonly springBootRepo = inject(SpringBootProgressRepository);
  private readonly storage = inject(StorageService);
  private readonly healthService = inject(ApiHealthService);

  getAll(): Observable<Record<number, QuestionProgress>> {
    const local$ = this.localRepo.getAll();

    // If logged in and backend is reachable, fetch authoritative progress from MySQL
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return local$.pipe(
        switchMap(localData => {
          if (!this.healthService.isSpringBootOnline()) {
            return of(localData);
          }
          return this.springBootRepo.getAll().pipe(
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
          );
        })
      );
    }

    return local$;
  }

  syncLocalToRemote(): Observable<void> {
    if (this.storage.isGuest() || !this.storage.getAccessToken()) return of(undefined);

    return this.localRepo.getAll().pipe(
      switchMap(localData => {
        if (localData && Object.keys(localData).length > 0) {
          return this.springBootRepo.sync(localData).pipe(
            map(() => undefined),
            catchError(() => of(undefined))
          );
        }
        return of(undefined);
      })
    );
  }

  save(questionId: number, progress: QuestionProgress): Observable<void> {
    const updatedProgress: QuestionProgress = {
      ...progress,
      updatedAt: progress.updatedAt || new Date().toISOString()
    };

    // 1. Save locally instantly (0ms response)
    this.localRepo.save(questionId, updatedProgress).subscribe();

    // 2. Sync to Spring Boot MySQL if authenticated
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      if (this.healthService.isSpringBootOnline()) {
        return this.springBootRepo.save(questionId, updatedProgress).pipe(
          catchError(() => {
            this.storage.queueOfflineMutation({
              id: `${questionId}_${Date.now()}`,
              type: 'PROGRESS',
              action: 'SAVE',
              payload: { questionId, progress: updatedProgress },
              timestamp: new Date().toISOString()
            });
            return of(undefined);
          })
        );
      } else {
        // Offline: enqueue mutation for background sync
        this.storage.queueOfflineMutation({
          id: `${questionId}_${Date.now()}`,
          type: 'PROGRESS',
          action: 'SAVE',
          payload: { questionId, progress: updatedProgress },
          timestamp: new Date().toISOString()
        });
      }
    }
    return of(undefined);
  }

  delete(questionId: number): Observable<void> {
    this.localRepo.delete(questionId).subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.delete(questionId);
    }
    return of(undefined);
  }

  reset(): Observable<void> {
    this.localRepo.reset().subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.reset();
    }
    return of(undefined);
  }
}
