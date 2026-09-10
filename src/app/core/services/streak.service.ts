import { Injectable, computed, inject } from '@angular/core';
import { StreakInfo } from '../models/activity.model';
import { ActivityService } from './activity.service';

/**
 * Pure function — fully unit-testable.
 * Computes current and longest streak from activity map.
 */
export function computeStreaks(activity: Record<string, number>): StreakInfo {
  const dates = Object.keys(activity)
    .filter(d => activity[d] > 0)
    .sort();

  if (dates.length === 0) return { current: 0, longest: 0 };

  // Compute longest streak
  let longest = 0;
  let run = 0;
  let prev: string | null = null;

  for (const d of dates) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86_400_000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  // Compute current streak (walking backward from today)
  const today = new Date().toISOString().slice(0, 10);
  const dateSet = new Set(dates);
  let current = 0;
  const cursor = new Date();

  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (dateSet.has(ds)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (ds === today) {
      // Today with no activity yet — skip to yesterday
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest };
}

@Injectable({ providedIn: 'root' })
export class StreakService {
  private readonly activityService = inject(ActivityService);

  readonly streak = computed<StreakInfo>(() =>
    computeStreaks(this.activityService.activity())
  );
}
