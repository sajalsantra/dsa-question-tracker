import { Injectable, signal, inject } from '@angular/core';
import { DailyGoal } from '../models/activity.model';
import { ActivityRepository } from '../repositories/activity.repository';
import { LocalActivityRepository } from '../repositories/local/local-activity.repository';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly repo = inject(ActivityRepository);

  private readonly _activity = signal<Record<string, number>>({});
  readonly activity = this._activity.asReadonly();

  private readonly _dailyGoal = signal<DailyGoal>({
    target: 5,
    date: todayStr(),
    count: 0
  });
  readonly dailyGoal = this._dailyGoal.asReadonly();

  load(): void {
    this.repo.getActivity().subscribe(a => this._activity.set(a));
    this.repo.getDailyGoal().subscribe(g => {
      // Refresh date if it's a new day
      if (g.date !== todayStr()) {
        g = { ...g, date: todayStr(), count: 0 };
        this.repo.saveDailyGoal(g).subscribe();
      }
      this._dailyGoal.set(g);
    });
  }

  /** Record that a question was solved/worked on today */
  recordActivity(): void {
    const today = todayStr();
    const current = this._activity()[today] ?? 0;
    const updated = current + 1;
    this._activity.update(a => ({ ...a, [today]: updated }));
    this.repo.saveActivity(today, updated).subscribe();

    // Increment daily goal count
    const goal = this._dailyGoal();
    const updatedGoal: DailyGoal = { ...goal, count: goal.count + 1 };
    this._dailyGoal.set(updatedGoal);
    this.repo.saveDailyGoal(updatedGoal).subscribe();
  }

  setGoalTarget(target: number): void {
    const goal: DailyGoal = { ...this._dailyGoal(), target };
    this._dailyGoal.set(goal);
    this.repo.saveDailyGoal(goal).subscribe();
  }

  resetAll(): void {
    this.repo.resetActivity().subscribe(() => {
      this._activity.set({});
      const freshGoal: DailyGoal = { target: 5, date: todayStr(), count: 0 };
      this._dailyGoal.set(freshGoal);
      this.repo.saveDailyGoal(freshGoal).subscribe();
    });
  }
}
