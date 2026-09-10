import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
      this.fbRepo.getActivity().pipe(
        tap(remoteLog => {
          if (remoteLog && Object.keys(remoteLog).length > 0) {
            for (const [date, count] of Object.entries(remoteLog)) {
              this.localRepo.saveActivity(date, count).subscribe();
            }
          }
        }),
        catchError(() => of({}))
      ).subscribe();
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
      this.fbRepo.getDailyGoal().pipe(
        tap(remoteGoal => {
          if (remoteGoal) {
            this.localRepo.saveDailyGoal(remoteGoal).subscribe();
          }
        }),
        catchError(() => of({ target: 3, lastUpdated: new Date().toISOString() }))
      ).subscribe();
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
}
