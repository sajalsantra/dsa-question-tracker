import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DailyGoal } from '../../models/activity.model';
import { ActivityRepository } from '../activity.repository';
import { StorageService } from '../../services/storage.service';

const DEFAULT_GOAL: DailyGoal = {
  target: 5,
  date: new Date().toISOString().slice(0, 10),
  count: 0
};

@Injectable({ providedIn: 'root' })
export class LocalActivityRepository extends ActivityRepository {
  private readonly storage = inject(StorageService);

  getActivity(): Observable<Record<string, number>> {
    return of(this.loadActivity());
  }

  saveActivity(date: string, count: number): Observable<void> {
    const all = this.loadActivity();
    all[date] = count;
    this.storage.setData('activity', all);
    return of(void 0);
  }

  resetActivity(): Observable<void> {
    this.storage.removeData('activity');
    return of(void 0);
  }

  getDailyGoal(): Observable<DailyGoal> {
    return of(this.loadGoal());
  }

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    this.storage.setData('goal', goal);
    return of(void 0);
  }

  private loadActivity(): Record<string, number> {
    return this.storage.getData<Record<string, number>>('activity') || {};
  }

  private loadGoal(): DailyGoal {
    const goal = this.storage.getData<DailyGoal>('goal');
    if (!goal) return { ...DEFAULT_GOAL };
    const today = new Date().toISOString().slice(0, 10);
    if (goal.date !== today) {
      goal.date = today;
      goal.count = 0;
      this.saveDailyGoal(goal);
    }
    return goal;
  }
}
