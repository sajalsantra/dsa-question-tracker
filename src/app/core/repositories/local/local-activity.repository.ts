import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DailyGoal } from '../../models/activity.model';
import { ActivityRepository } from '../activity.repository';

const ACTIVITY_KEY = 'dsaActivity';
const GOAL_KEY = 'dsaDailyGoal';

const DEFAULT_GOAL: DailyGoal = {
  target: 5,
  date: new Date().toISOString().slice(0, 10),
  count: 0
};

@Injectable({ providedIn: 'root' })
export class LocalActivityRepository extends ActivityRepository {

  getActivity(): Observable<Record<string, number>> {
    return of(this.loadActivity());
  }

  saveActivity(date: string, count: number): Observable<void> {
    const all = this.loadActivity();
    all[date] = count;
    this.persistActivity(all);
    return of(void 0);
  }

  resetActivity(): Observable<void> {
    localStorage.removeItem(ACTIVITY_KEY);
    return of(void 0);
  }

  getDailyGoal(): Observable<DailyGoal> {
    return of(this.loadGoal());
  }

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    try {
      localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    } catch (e) {
      console.error('Failed to persist daily goal:', e);
    }
    return of(void 0);
  }

  private loadActivity(): Record<string, number> {
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistActivity(data: Record<string, number>): void {
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to persist activity:', e);
    }
  }

  private loadGoal(): DailyGoal {
    try {
      const raw = localStorage.getItem(GOAL_KEY);
      if (!raw) return { ...DEFAULT_GOAL };
      const goal: DailyGoal = JSON.parse(raw);
      // Reset count if it's a new day
      const today = new Date().toISOString().slice(0, 10);
      if (goal.date !== today) {
        goal.date = today;
        goal.count = 0;
        this.saveDailyGoal(goal);
      }
      return goal;
    } catch {
      return { ...DEFAULT_GOAL };
    }
  }
}
