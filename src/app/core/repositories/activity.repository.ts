import { Observable } from 'rxjs';
import { DailyGoal } from '../models/activity.model';

export abstract class ActivityRepository {
  abstract getActivity(): Observable<Record<string, number>>;
  abstract saveActivity(date: string, count: number): Observable<void>;
  abstract resetActivity(): Observable<void>;

  abstract getDailyGoal(): Observable<DailyGoal>;
  abstract saveDailyGoal(goal: DailyGoal): Observable<void>;
}
