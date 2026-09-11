import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, startWith } from 'rxjs/operators';
import { ActivityRepository } from '../activity.repository';
import { DailyGoal } from '../../models/activity.model';
import { LocalActivityRepository } from '../local/local-activity.repository';
import { FirebaseActivityRepository } from '../firebase/firebase-activity.repository';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class HybridActivityRepository implements ActivityRepository {
  private readonly localRepo = inject(LocalActivityRepository);
  private readonly fbRepo = inject(FirebaseActivityRepository);
  private readonly fb = inject(FirebaseService);

  getActivity(): Observable<Record<string, number>> {
    const local$ = this.localRepo.getActivity();

    if (this.fb.auth.currentUser) {
      return local$.pipe(
        switchMap(localData =>
          this.fbRepo.getActivity().pipe(
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
          )
        )
      );
    }

    return local$;
  }

  saveActivity(date: string, count: number): Observable<void> {
    this.localRepo.saveActivity(date, count).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.saveActivity(date, count);
    }
    return of(undefined);
  }

  resetActivity(): Observable<void> {
    this.localRepo.resetActivity().subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.resetActivity();
    }
    return of(undefined);
  }

  getDailyGoal(): Observable<DailyGoal> {
    const local$ = this.localRepo.getDailyGoal();

    if (this.fb.auth.currentUser) {
      return local$.pipe(
        switchMap(localData =>
          this.fbRepo.getDailyGoal().pipe(
            map(remoteGoal => {
              if (remoteGoal) {
                this.localRepo.saveDailyGoal(remoteGoal).subscribe();
                return remoteGoal;
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

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    this.localRepo.saveDailyGoal(goal).subscribe();
    if (this.fb.auth.currentUser) {
      return this.fbRepo.saveDailyGoal(goal);
    }
    return of(undefined);
  }

  syncLocalToRemote(): Observable<void> {
    if (!this.fb.auth.currentUser) return of(undefined);

    this.localRepo.getActivity().pipe(
      tap(localLog => {
        if (localLog && Object.keys(localLog).length > 0) {
          for (const [date, count] of Object.entries(localLog)) {
            this.fbRepo.saveActivity(date, count).subscribe();
          }
        }
      }),
      catchError(() => of({}))
    ).subscribe();

    this.localRepo.getDailyGoal().pipe(
      tap(localGoal => {
        if (localGoal) {
          this.fbRepo.saveDailyGoal(localGoal).subscribe();
        }
      }),
      catchError(() => of(undefined))
    ).subscribe();

    return of(undefined);
  }
}
