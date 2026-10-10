import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ActivityRepository } from '../activity.repository';
import { DailyGoal } from '../../models/activity.model';
import { environment } from '../../../../environments/environment';

const DEFAULT_GOAL: DailyGoal = {
  target: 5,
  date: new Date().toISOString().slice(0, 10),
  count: 0
};

@Injectable({ providedIn: 'root' })
export class SpringBootActivityRepository extends ActivityRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/activity`;

  getActivity(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(this.baseUrl).pipe(
      catchError(err => {
        console.warn('Failed to fetch activity from MySQL:', err);
        return of({});
      })
    );
  }

  saveActivity(date: string, count: number): Observable<void> {
    return this.http.post<void>(this.baseUrl, { date, count }).pipe(
      catchError(err => {
        console.warn(`Failed to save activity for ${date} to MySQL:`, err);
        return of(undefined);
      })
    );
  }

  sync(activityMap: Record<string, number>): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>(`${this.baseUrl}/sync`, activityMap).pipe(
      catchError(err => {
        console.warn('Failed to sync activity batch to MySQL:', err);
        return of({});
      })
    );
  }

  resetActivity(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reset`).pipe(
      catchError(() => of(undefined))
    );
  }

  getDailyGoal(): Observable<DailyGoal> {
    return this.http.get<any>(`${this.baseUrl}/goal`).pipe(
      map(res => {
        if (!res) return DEFAULT_GOAL;
        return {
          target: res.target ?? DEFAULT_GOAL.target,
          date: new Date().toISOString().slice(0, 10),
          count: res.count ?? 0
        };
      }),
      catchError(() => of(DEFAULT_GOAL))
    );
  }

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/goal`, goal).pipe(
      catchError(() => of(undefined))
    );
  }
}
