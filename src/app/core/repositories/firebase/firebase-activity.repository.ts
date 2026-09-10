import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ActivityRepository } from '../activity.repository';
import { DailyGoal } from '../../models/activity.model';
import { FirebaseService } from '../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class FirebaseActivityRepository implements ActivityRepository {
  private readonly fb = inject(FirebaseService);

  private get userDocRef() {
    const user = this.fb.auth.currentUser;
    if (!user) return null;
    return doc(this.fb.db, 'users', user.uid, 'appData', 'activity');
  }

  getActivity(): Observable<Record<string, number>> {
    const ref = this.userDocRef;
    if (!ref) return of({});

    return from(getDoc(ref)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          return (data['log'] as Record<string, number>) || {};
        }
        return {};
      }),
      catchError(err => {
        console.warn('Firestore Activity fetch failed:', err);
        return of({});
      })
    );
  }

  saveActivity(date: string, count: number): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { log: { [date]: count } }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Activity save failed:', err);
        return of(undefined);
      })
    );
  }

  resetActivity(): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { log: {} }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Activity reset failed:', err);
        return of(undefined);
      })
    );
  }

  getDailyGoal(): Observable<DailyGoal> {
    const ref = this.userDocRef;
    const defaultGoal: DailyGoal = { target: 5, date: new Date().toISOString().slice(0, 10), count: 0 };
    if (!ref) return of(defaultGoal);

    return from(getDoc(ref)).pipe(
      map(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          return (data['goal'] as DailyGoal) || defaultGoal;
        }
        return defaultGoal;
      }),
      catchError(() => of(defaultGoal))
    );
  }

  saveDailyGoal(goal: DailyGoal): Observable<void> {
    const ref = this.userDocRef;
    if (!ref) return of(undefined);

    return from(setDoc(ref, { goal }, { merge: true })).pipe(
      map(() => undefined),
      catchError(err => {
        console.warn('Firestore Goal save failed:', err);
        return of(undefined);
      })
    );
  }
}
