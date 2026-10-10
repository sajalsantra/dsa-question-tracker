import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { ActivityRepository } from '../activity.repository';
import { DailyGoal } from '../../models/activity.model';
import { LocalActivityRepository } from '../local/local-activity.repository';
import { SpringBootActivityRepository } from '../springboot/springboot-activity.repository';
import { StorageService } from '../../services/storage.service';
import { ApiHealthService } from '../../services/api-health.service';

@Injectable({ providedIn: 'root' })
export class HybridActivityRepository implements ActivityRepository {
  private readonly localRepo = inject(LocalActivityRepository);
  private readonly springBootRepo = inject(SpringBootActivityRepository);
  private readonly storage = inject(StorageService);
  private readonly healthService = inject(ApiHealthService);

  getActivity(): Observable<Record<string, number>> {
    const local$ = this.localRepo.getActivity();

    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return local$.pipe(
        switchMap(localData => {
          if (!this.healthService.isSpringBootOnline()) {
            return of(localData);
          }
          return this.springBootRepo.getActivity().pipe(
            map(remoteLog => {
              if (remoteLog && Object.keys(remoteLog).length > 0) {
                for (const [date, count] of Object.entries(remoteLog)) {
                  this.localRepo.saveActivity(date, count).subscribe();
                }
                return remoteLog;
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

  saveActivity(date: string, count: number): Observable<void> {
    this.localRepo.saveActivity(date, count).subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      if (this.healthService.isSpringBootOnline()) {
        return this.springBootRepo.saveActivity(date, count).pipe(
          catchError(() => {
            this.storage.queueOfflineMutation({
              id: `act_${date}_${Date.now()}`,
              type: 'ACTIVITY',
              action: 'SAVE',
              payload: { date, count },
              timestamp: new Date().toISOString()
            });
            return of(undefined);
          })
        );
      } else {
        this.storage.queueOfflineMutation({
          id: `act_${date}_${Date.now()}`,
          type: 'ACTIVITY',
          action: 'SAVE',
          payload: { date, count },
          timestamp: new Date().toISOString()
        });
      }
    }
    return of(undefined);
  }

  resetActivity(): Observable<void> {
    this.localRepo.resetActivity().subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.resetActivity();
    }
    return of(undefined);
  }

  getDailyGoal(): Observable<DailyGoal> {
    const local$ = this.localRepo.getDailyGoal();

    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return local$.pipe(
        switchMap(localData => {
          if (!this.healthService.isSpringBootOnline()) {
            return of(localData);
          }
          return this.springBootRepo.getDailyGoal().pipe(
            map(remoteGoal => {
              if (remoteGoal) {
                this.localRepo.saveDailyGoal(remoteGoal).subscribe();
                return remoteGoal;
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

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    this.localRepo.saveDailyGoal(goal).subscribe();
    if (!this.storage.isGuest() && this.storage.getAccessToken()) {
      return this.springBootRepo.saveDailyGoal(goal);
    }
    return of(undefined);
  }

  syncLocalToRemote(): Observable<void> {
    if (this.storage.isGuest() || !this.storage.getAccessToken()) return of(undefined);

    this.localRepo.getActivity().pipe(
      switchMap(localLog => {
        if (localLog && Object.keys(localLog).length > 0) {
          return this.springBootRepo.sync(localLog);
        }
        return of({});
      }),
      catchError(() => of({}))
    ).subscribe();

    this.localRepo.getDailyGoal().pipe(
      switchMap(localGoal => {
        if (localGoal) {
          return this.springBootRepo.saveDailyGoal(localGoal);
        }
        return of(undefined);
      }),
      catchError(() => of(undefined))
    ).subscribe();

    return of(undefined);
  }
}
